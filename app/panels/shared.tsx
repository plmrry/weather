import { ChevronDown, Clock, Info } from "lucide-react";
import type { ComponentType, JSX, ReactNode } from "react";

import { RelativeTime } from "../relative-time";

export type RadarImagery = {
  ridge: { latestUrl: string; loopUrl: string };
  iem: { reflectivityUrl: string; bbox: number[] };
  rainviewer: {
    host: string;
    tileSize: number;
    zoom: number;
    color: number;
    options: string;
    center: { x: number; y: number };
    basemapTemplate: string;
    frames: { time: number; path: string; kind: "past" | "nowcast" }[];
  } | null;
};

/** Cache-busts an image URL with an opaque token (e.g. the fetch timestamp). */
export function bust(url: string, token: string) {
  return `${url}${url.includes("?") ? "&" : "?"}_=${encodeURIComponent(token)}`;
}

export function fmtClock(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** Relative "updated N min ago" stamp shown above each image, computed with Temporal. */
export function Stamp({ iso }: { iso: string }): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="size-3.5 shrink-0" />
      <span>
        Updated <RelativeTime iso={iso} className="text-foreground" />
      </span>
    </div>
  );
}

/** Collapsible "more info" disclosure for a single source, using native <details> for a11y. */
export function MoreInfo({ children }: { children: ReactNode }): JSX.Element {
  return (
    <details className="group rounded-md border border-border bg-secondary/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5">
          <Info className="size-3.5 text-muted-foreground" />
          More info
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-3 py-2.5">{children}</div>
    </details>
  );
}

/** Label/value definition list used inside MoreInfo blocks. */
export function InfoList({ items }: { items: { label: string; value: ReactNode }[] }): JSX.Element {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs leading-relaxed">
      {items.map((item, i) => (
        <div className="contents" key={i}>
          <dt className="text-muted-foreground/70">{item.label}</dt>
          <dd className="text-foreground text-pretty">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Wraps each source in a titled block so the stack reads clearly. */
export function SourceBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-accent" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}
