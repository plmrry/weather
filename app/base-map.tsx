"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { geoEquirectangular, geoPath } from "d3-geo"
import type { Feature, FeatureCollection, Geometry } from "geojson"
import { LoaderCircle, Map as MapIcon } from "lucide-react"

type City = { name: string; lon: number; lat: number; pop: number; capital: boolean }
type BaseMapData = {
  bbox: [number, number, number, number]
  states: FeatureCollection<Geometry>
  roads: FeatureCollection<Geometry>
  cities: City[]
}

const SIZE = 600

const fetcher = async (url: string): Promise<BaseMapData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`basemap ${res.status}`)
  return res.json()
}

export function BaseMap({
  bbox,
  center,
}: {
  bbox: [number, number, number, number]
  center: { lon: number; lat: number }
}) {
  const [minx, miny, maxx, maxy] = bbox
  const key = `/api/basemap?minx=${minx}&miny=${miny}&maxx=${maxx}&maxy=${maxy}`
  const { data, error, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600_000,
  })

  const rendered = useMemo(() => {
    if (!data) return null
    // Equirectangular fitted to the box matches the plate-carrée radar framing.
    const boxPolygon: Feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [minx, miny],
            [maxx, miny],
            [maxx, maxy],
            [minx, maxy],
            [minx, miny],
          ],
        ],
      },
    }
    const projection = geoEquirectangular().fitSize([SIZE, SIZE], boxPolygon)
    const path = geoPath(projection)

    const statePaths = data.states.features.map((f, i) => path(f) ?? "").filter(Boolean)
    const roadPaths = data.roads.features.map((f) => path(f) ?? "").filter(Boolean)
    const cityPoints = data.cities
      .map((c) => {
        const p = projection([c.lon, c.lat])
        return p ? { ...c, x: p[0], y: p[1] } : null
      })
      .filter((c): c is City & { x: number; y: number } => c !== null)
    const centerPoint = projection([center.lon, center.lat])

    return { statePaths, roadPaths, cityPoints, centerPoint }
  }, [data, minx, miny, maxx, maxy, center.lon, center.lat])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-md border border-border bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-muted-foreground">
            Reference map unavailable.
          </div>
        )}
        {rendered && (
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="h-full w-full"
            role="img"
            aria-label="Black and white reference map showing state boundaries, primary roads, and cities for the radar coverage area"
          >
            {/* Primary roads — faint gray lines */}
            <g fill="none" stroke="oklch(0.55 0 0)" strokeWidth={0.8} strokeLinejoin="round" strokeLinecap="round">
              {rendered.roadPaths.map((d, i) => (
                <path key={`r${i}`} d={d} />
              ))}
            </g>

            {/* State boundaries — bright white outlines */}
            <g fill="none" stroke="oklch(0.98 0 0)" strokeWidth={1.6} strokeLinejoin="round">
              {rendered.statePaths.map((d, i) => (
                <path key={`s${i}`} d={d} />
              ))}
            </g>

            {/* Cities — white dots with haloed labels */}
            <g
              fontFamily="var(--font-mono, monospace)"
              fontSize={12}
              style={{ paintOrder: "stroke" }}
              stroke="oklch(0 0 0)"
              strokeWidth={3}
            >
              {rendered.cityPoints.map((c, i) => (
                <g key={`c${i}`} transform={`translate(${c.x},${c.y})`}>
                  <circle r={2.5} fill="oklch(0.98 0 0)" stroke="none" />
                  <text x={5} y={4} fill="oklch(0.9 0 0)" stroke="oklch(0 0 0)" strokeWidth={3} paintOrder="stroke">
                    {c.name}
                  </text>
                </g>
              ))}
            </g>

            {/* Query point — accent crosshair */}
            {rendered.centerPoint && (
              <g
                transform={`translate(${rendered.centerPoint[0]},${rendered.centerPoint[1]})`}
                stroke="oklch(0.8 0.15 75)"
                strokeWidth={1.5}
                fill="none"
              >
                <circle r={7} />
                <line x1={-11} y1={0} x2={-4} y2={0} />
                <line x1={4} y1={0} x2={11} y2={0} />
                <line x1={0} y1={-11} x2={0} y2={-4} />
                <line x1={0} y1={4} x2={0} y2={11} />
              </g>
            )}
          </svg>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapIcon className="size-3.5 shrink-0" />
        State boundaries (US Census / us-atlas), primary roads (Census TIGERweb), and cities (Natural Earth) for the
        same coverage area. Rendered with d3-geo.
      </p>
    </div>
  )
}
