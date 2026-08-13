import { bust, MoreInfo, InfoList, Stamp, type RadarImagery } from "./shared"

/** NWS RIDGE — government per-station imagery: latest still. */
export function RidgePanel({ imagery, token }: { imagery: RadarImagery; token: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Base reflectivity rendered by the National Weather Service (RIDGE). Updates every volume scan (~4–6 min).
      </p>
      <MoreInfo>
        <InfoList
          items={[
            { label: "Provider", value: "National Weather Service — radar.weather.gov" },
            { label: "Product", value: "Base reflectivity, standard resolution GIF" },
            {
              label: "Projection",
              value:
                "Pre-rendered per station by the NWS — a custom raster (not a plain lat/lon grid), with county lines and range rings baked in.",
            },
            { label: "Cadence", value: "~4–6 min, one image per volume scan" },
            {
              label: "Source",
              value: (
                <a
                  href={imagery.ridge.latestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline decoration-dotted underline-offset-4"
                >
                  Latest image →
                </a>
              ),
            },
          ]}
        />
      </MoreInfo>
      <Stamp iso={token} />
      <div className="overflow-hidden rounded-md border border-border bg-secondary/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={token}
          src={bust(imagery.ridge.latestUrl, token) || "/placeholder.svg"}
          alt="NWS RIDGE base reflectivity latest frame"
          className="h-auto w-full"
          loading="lazy"
        />
      </div>
    </div>
  )
}
