import type { JSX } from "react";
import { WeatherPage } from "#/app/weather-page";

export default function Page({
  params,
}: PageProps<"/latitude/[latitude]/longitude/[longitude]">): JSX.Element {
  return <WeatherPage params={params} />;
}
