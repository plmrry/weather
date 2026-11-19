import React from "react";
import Card from "./ui/card";

export function Section({
  ariaLabel,
  children,
  icon,
  title,
}: {
  ariaLabel?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
}) {
  return (
    <section aria-label={ariaLabel} className="relative">
      <Card.Root>
        <Card.Header>
          <div className="flex flex-row items-center gap-1.5">
            {icon}
            <Card.Title>
              <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                {title}
              </h2>
            </Card.Title>
          </div>
        </Card.Header>
        {children}
      </Card.Root>
    </section>
  );
}
