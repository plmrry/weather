import React from "react";
import { MAP_SIZE } from "#/app/map-projection";
import Card from "#/app/ui/card";

export function Panel({
  children,
  description,
  icon,
  title,
}: {
  description?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
} & Omit<React.ComponentProps<"div">, "title">): React.JSX.Element {
  return (
    <Card.Root aria-label={title}>
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
        <svg
          aria-label={title}
          className="size-full"
          role="img"
          viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
        >
          {children}
        </svg>
      </div>
    </Card.Root>
  );
}
