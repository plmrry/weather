"use client";

import React from "react";

const GeoContext = React.createContext<string | undefined>(undefined);

export function Provider({ children }: React.PropsWithChildren): React.JSX.Element {
  const randomNumber = Math.random();
  return <GeoContext value={`${randomNumber}%%${randomNumber}`}>{children}</GeoContext>;
}

export function useRandomNumber() {
  return React.useContext(GeoContext);
}
