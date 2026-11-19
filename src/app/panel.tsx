import React from "react";
import { ErrorBoundary } from "#/app/error-boundary";
import Card from "#/app/ui/card";

export function Panel({
  children,
  icon,
  timestamp,
  title,
}: {
  icon?: React.ReactNode;
  timestamp?: React.ReactNode;
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
        <Card.Description>Last updated: {timestamp}</Card.Description>
      </Card.Header>
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-white bg-black">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </Card.Root>
  );
}
