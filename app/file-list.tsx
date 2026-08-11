import { Database, Download } from "lucide-react"

export type RadarFile = {
  key: string
  name: string
  url: string
  size: number
  lastModified: string | null
  scanTime: string | null
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatScan(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  })
}

function relativeAge(iso: string | null): string | null {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return null
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  return `${Math.round(hrs / 24)} d ago`
}

export function FileList({
  files,
  fileCount,
  bucketListing,
}: {
  files: RadarFile[]
  fileCount: number
  bucketListing: string
}) {
  return (
    <section aria-labelledby="files-heading" className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-accent" />
          <h2 id="files-heading" className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Raw Level II volume scans
          </h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {files.length} of {fileCount} shown
        </span>
      </div>

      {files.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          No Level II files listed for this station in the current UTC window.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {files.map((file, i) => {
            const age = relativeAge(file.scanTime)
            return (
              <li
                key={file.key}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-secondary/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm text-foreground">{file.name}</span>
                    {i === 0 && age && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-accent">
                        <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                        latest · {age}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {formatScan(file.scanTime)} · {formatBytes(file.size)}
                  </div>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  aria-label={`Download raw radar file ${file.name}`}
                >
                  <Download className="size-3.5" />
                  Download
                </a>
              </li>
            )
          })}
        </ul>
      )}

      <div className="border-t border-border p-4">
        <a
          href={bucketListing}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
        >
          View raw S3 bucket listing (XML) →
        </a>
      </div>
    </section>
  )
}
