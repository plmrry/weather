import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "#/app/ui/card";

export function Panel({
  children,
  description,
  icon,
  title,
  ...props
}: Omit<React.ComponentProps<typeof Card>, "title"> & {
  description?: React.ReactNode;
  icon?: React.ReactNode;
  title: React.ReactNode;
}): React.JSX.Element {
  const heading = (
    <CardTitle>
      <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
        {title}
      </h2>
    </CardTitle>
  );

  return (
    <Card {...props}>
      <CardContent className="mx-auto flex w-full max-w-md flex-col gap-4">
        <CardHeader className="flex flex-col gap-1 px-0">
          {icon ? (
            <div className="flex flex-row items-center gap-1.5">
              {icon}
              {heading}
            </div>
          ) : (
            heading
          )}
          {description}
        </CardHeader>
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-white bg-black">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
