import React from "react";
import { Content, Header, Root, Title } from "#/app/ui/card";

export function Panel({
  children,
  description,
  icon,
  title,
  ...props
}: {
  description?: React.ReactNode;
  icon?: React.ReactNode;
  title: React.ReactNode;
} & Omit<React.ComponentProps<typeof Root>, "title">): React.JSX.Element {
  const heading = (
    <Title>
      <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
        {title}
      </h2>
    </Title>
  );

  return (
    <Root {...props}>
      <Content className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Header className="flex flex-col gap-1 px-0">
          {icon ? (
            <div className="flex flex-row items-center gap-1.5">
              {icon}
              {heading}
            </div>
          ) : (
            heading
          )}
          {description}
        </Header>
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-white bg-black">
          {children}
        </div>
      </Content>
    </Root>
  );
}
