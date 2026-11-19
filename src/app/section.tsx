import React from "react";

function SectionRoot({
  "aria-label": ariaLabel,
  children,
}: {
  "aria-label"?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card p-[calc(var(--card-spacing)*2)] text-sm text-card-foreground ring-4 ring-foreground/10 [contain-intrinsic-block-size:auto_800px] [content-visibility:auto]"
      data-slot="card"
    >
      {children}
    </div>
  );
}

function SectionHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="group/card-header @container/card-header grid auto-rows-min items-start gap-1"
      data-slot="card-header"
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="text-base leading-snug font-medium group-data-[size=sm]/card:text-sm"
      data-slot="card-title"
    >
      {children}
    </div>
  );
}

function SectionBody({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="relative flex flex-col gap-(--card-spacing) text-sm text-muted-foreground"
      data-slot="card-description"
    >
      {children}
    </div>
  );
}

export function Section({
  "aria-busy": ariaBusy,
  ariaLabel,
  children,
  icon,
  title,
}: {
  "aria-busy"?: React.AriaAttributes["aria-busy"];
  ariaLabel?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
}) {
  return (
    <section aria-busy={ariaBusy} aria-label={ariaLabel} className="relative">
      <SectionRoot>
        <SectionHeader>
          <div className="flex flex-row items-center gap-1.5">
            {icon}
            <SectionTitle>
              <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                {title}
              </h2>
            </SectionTitle>
          </div>
        </SectionHeader>
        <SectionBody>{children}</SectionBody>
      </SectionRoot>
    </section>
  );
}
