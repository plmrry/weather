"use client"

import { useEffect, useState } from "react"
import { Temporal } from "temporal-polyfill"

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

/** Format the signed gap between `then` and now into a human relative string via Temporal. */
function formatRelative(iso: string): string {
  let instant: Temporal.Instant
  try {
    instant = Temporal.Instant.from(iso)
  } catch {
    return "just now"
  }

  // Duration from the retrieval instant up to now (positive = in the past).
  const seconds = Temporal.Now.instant().since(instant).total("seconds")
  const past = seconds >= 0
  const abs = Math.abs(seconds)

  if (abs < 10) return "just now"

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
    ["second", 1],
  ]

  for (const [unit, size] of units) {
    if (abs >= size) {
      const value = Math.floor(abs / size)
      return rtf.format(past ? -value : value, unit)
    }
  }
  return "just now"
}

export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const [label, setLabel] = useState(() => formatRelative(iso))

  useEffect(() => {
    setLabel(formatRelative(iso))
    const id = setInterval(() => setLabel(formatRelative(iso)), 1000)
    return () => clearInterval(id)
  }, [iso])

  const exact = (() => {
    try {
      return Temporal.Instant.from(iso).toLocaleString()
    } catch {
      return iso
    }
  })()

  return (
    <time dateTime={iso} title={exact} className={className}>
      {label}
    </time>
  )
}
