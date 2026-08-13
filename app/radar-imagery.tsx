import { Map as MapIcon, Radio, Satellite } from "lucide-react"
import { SourceBlock, type RadarImagery } from "./panels/shared"
import { MesonetPanel } from "./panels/mesonet-panel"
import { RidgePanel } from "./panels/ridge-panel"
import { RainViewerPanel } from "./panels/rainviewer-panel"

export type { RadarImagery }

export function RadarImageryPanel({
  imagery,
  retrievedAt,
}: {
  imagery: RadarImagery
  retrievedAt: string
}) {
  return (
    <section aria-label="Rendered radar imagery" className="rounded-lg border border-border bg-card">
      <div className="flex flex-col divide-y divide-border">
        <div className="p-4">
          <SourceBlock icon={MapIcon} title="MESONET">
            <MesonetPanel
              bbox={imagery.iem.bbox as [number, number, number, number]}
              center={{
                lon: (imagery.iem.bbox[0] + imagery.iem.bbox[2]) / 2,
                lat: (imagery.iem.bbox[1] + imagery.iem.bbox[3]) / 2,
              }}
              overlayUrl={imagery.iem.reflectivityUrl}
              overlayToken={retrievedAt}
            />
          </SourceBlock>
        </div>

        <div className="p-4">
          <SourceBlock icon={Radio} title="NWS RIDGE">
            <RidgePanel imagery={imagery} token={retrievedAt} />
          </SourceBlock>
        </div>

        {imagery.rainviewer && (
          <div className="p-4">
            <SourceBlock icon={Satellite} title="RainViewer">
              <RainViewerPanel imagery={imagery} />
            </SourceBlock>
          </div>
        )}
      </div>
    </section>
  )
}
