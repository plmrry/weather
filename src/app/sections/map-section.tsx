import React from "react";
import { io } from "next/cache";
import { Section } from "#/app/section";

export function MapSection(
  props: React.ComponentProps<typeof MapSectionRendered>,
) {
  return (
    <React.Suspense name="MapSection">
      <MapSectionRendered {...props} />
    </React.Suspense>
  );
}

async function MapSectionRendered({
  icon,
  mapLayers = [],
  radarFrames = [],
  radarTimestamps = [],
  title,
}: {
  icon?: React.ReactNode;
  mapLayers?: React.ReactNode[];
  radarFrames?: React.ReactNode[];
  radarTimestamps?: React.ReactNode[];
  title?: string;
} = {}): Promise<React.JSX.Element> {
  await io();

  return (
    <Section ariaLabel={title} icon={icon} title={title}>
      <span className="inline-flex gap-1">
        Last updated:
        <span
          className="grid"
          data-panel-radar-timestamps
          style={
            {
              "--frame-count": radarTimestamps.length,
            } as React.CSSProperties
          }
        >
          {radarTimestamps.map((timestamp, index) => (
            <span
              className="invisible min-h-0 min-w-0 animate-frames [grid-area:1/1] only:visible only:animate-none"
              data-panel-radar-timestamp
              key={index}
              style={{ "--frame-index": index } as React.CSSProperties}
            >
              {timestamp}
            </span>
          ))}
        </span>
      </span>
      <div className="grid aspect-square w-full overflow-hidden rounded-md border border-white bg-black">
        <div className="contents" data-panel-map-layers>
          {mapLayers.map((layer, index) => (
            <div
              className="min-h-0 min-w-0 [grid-area:1/1]"
              data-panel-map-layer
              key={index}
            >
              {layer}
            </div>
          ))}
        </div>
        <div
          className="contents"
          data-panel-radar-frames
          style={{ "--frame-count": radarFrames.length } as React.CSSProperties}
        >
          {radarFrames.map((frame, index) => (
            <div
              className="invisible min-h-0 min-w-0 animate-frames [grid-area:1/1] only:visible only:animate-none"
              data-panel-radar-frame
              key={index}
              style={{ "--frame-index": index } as React.CSSProperties}
            >
              {frame}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
