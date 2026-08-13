"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { geoEquirectangular, geoPath } from "d3-geo"
import type { Feature, FeatureCollection, Geometry } from "geojson"
import { LoaderCircle, Map as MapIcon } from "lucide-react"
import { bust, MoreInfo, InfoList, Stamp } from "./shared"

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

/** Iowa Environmental Mesonet — WMS reflectivity mosaic layered beneath a d3-geo reference map. */
export function MesonetPanel({
  bbox,
  center,
  overlayUrl,
  overlayToken,
}: {
  bbox: [number, number, number, number]
  center: { lon: number; lat: number }
  /** Raster layer sharing the same EPSG:4326 bbox — drawn beneath the vector map so the two align exactly. */
  overlayUrl?: string
  overlayToken?: string
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
    // Fit to the four corner *points* (a MultiPoint) rather than a polygon:
    // d3-geo treats polygon winding spherically, so a wrongly-wound box ring is
    // read as "whole globe minus box" and collapses the projection to a dot.
    const cornerPoints: Feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPoint",
        coordinates: [
          [minx, miny],
          [maxx, miny],
          [maxx, maxy],
          [minx, maxy],
        ],
      },
    }
    const projection = geoEquirectangular().fitSize([SIZE, SIZE], cornerPoints)
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

  const hasOverlay = Boolean(overlayUrl && overlayToken)

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapIcon className="size-3.5 shrink-0" />
        State boundaries, primary roads (Census TIGERweb), and cities (Natural Earth). Rendered with d3-geo.
      </p>
      <MoreInfo>
        <InfoList
          items={[
            {
              label: "Sources",
              value:
                "us-atlas TopoJSON (states), Census TIGERweb (primary roads, queried live per bounding box), Natural Earth (cities)",
            },
            {
              label: "Rendering",
              value:
                "d3-geo equirectangular projection, fit to the same EPSG:4326 bounding box as the Mesonet WMS request — the two share one coordinate grid, so the radar image can be layered directly beneath the vector map with no reprojection.",
            },
            {
              label: "Overlay",
              value:
                "The colored layer is the live Mesonet reflectivity mosaic, shown in context with roads, boundaries, and cities.",
            },
            {
              label: "Freshness",
              value: "Vector layer is static reference geography; the overlay updates on the same ~5 min Mesonet cadence.",
            },
          ]}
        />
      </MoreInfo>
      {overlayToken && <Stamp iso={overlayToken} />}
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
          <>
            {/* Mesonet WMS reflectivity — same EPSG:4326 bbox as the projection fit below, so it lines up exactly. */}
            {hasOverlay && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={overlayToken}
                src={bust(overlayUrl!, overlayToken!) || "/placeholder.svg"}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            )}
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={
                hasOverlay
                  ? "Reference map with state boundaries, primary roads, and cities layered over the live Mesonet reflectivity image for the radar coverage area"
                  : "Black and white reference map showing state boundaries, primary roads, and cities for the radar coverage area"
              }
            >
              {/* Primary roads — halo, then a bright line so they read over the color reflectivity layer */}
              <g fill="none" strokeLinejoin="round" strokeLinecap="round">
                <g stroke="oklch(0 0 0)" strokeOpacity={0.6} strokeWidth={2.2}>
                  {rendered.roadPaths.map((d, i) => (
                    <path key={`rh${i}`} d={d} />
                  ))}
                </g>
                <g stroke={hasOverlay ? "oklch(0.92 0 0)" : "oklch(0.55 0 0)"} strokeWidth={0.8}>
                  {rendered.roadPaths.map((d, i) => (
                    <path key={`r${i}`} d={d} />
                  ))}
                </g>
              </g>

              {/* State boundaries — halo, then bright white outlines */}
              <g fill="none" strokeLinejoin="round">
                <g stroke="oklch(0 0 0)" strokeOpacity={0.6} strokeWidth={3.2}>
                  {rendered.statePaths.map((d, i) => (
                    <path key={`sh${i}`} d={d} />
                  ))}
                </g>
                <g stroke="oklch(0.98 0 0)" strokeWidth={1.6}>
                  {rendered.statePaths.map((d, i) => (
                    <path key={`s${i}`} d={d} />
                  ))}
                </g>
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
          </>
        )}
      </div>
    </div>
  )
}
