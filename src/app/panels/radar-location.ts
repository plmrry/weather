export function truncateRadarCoordinate(coordinate: number): string {
  const truncated = Math.trunc(coordinate * 100) / 100;
  return (Object.is(truncated, -0) ? 0 : truncated).toFixed(2);
}
