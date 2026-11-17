import { CloudRainWind } from "lucide-static";
import { ImageResponse } from "next/og";

export const size = {
  height: 64,
  width: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#0f172a",
        borderRadius: 16,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <img
        alt=""
        height={48}
        src={`data:image/svg+xml,${encodeURIComponent(CloudRainWind)}`}
        style={{ filter: "invert(1)" }}
        width={48}
      />
    </div>,
    size,
  );
}
