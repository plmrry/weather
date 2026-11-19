import React from "react";

function Root({
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

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="group/card-header @container/card-header grid auto-rows-min items-start gap-1"
      data-slot="card-header"
    >
      {children}
    </div>
  );
}

function Title({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="text-base leading-snug font-medium group-data-[size=sm]/card:text-sm"
      data-slot="card-title"
    >
      {children}
    </div>
  );
}

function Description({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-sm text-muted-foreground ${className}`}
      data-slot="card-description"
    >
      {children}
    </div>
  );
}

function Footer({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="flex items-center border-t bg-muted/50 p-(--card-spacing)"
      data-slot="card-footer"
    >
      {children}
    </div>
  );
}

export { Description, Footer, Header, Root, Title };

export default { Description, Footer, Header, Root, Title };
