import React from "react";
import Card from "#/app/ui/card";

export function Panel({
  "aria-label": ariaLabel,
  children,
  description,
  icon,
  title,
}: {
  "aria-label"?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  title: React.ReactNode;
} & Omit<React.ComponentProps<"div">, "title">): React.JSX.Element {
  return (
    <Card.Root aria-label={ariaLabel}>
      <Card.Header>
        <div className="flex flex-row items-center gap-1.5">
          {icon}
          <Card.Title>
            <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
              {title}
            </h2>
          </Card.Title>
        </div>
        {description}
      </Card.Header>
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-white bg-black">
        {children}
      </div>
    </Card.Root>
  );
}
