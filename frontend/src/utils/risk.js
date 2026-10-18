// One place that decides what a score or a stored risk name looks like.

const LEVELS = {
  low: { key: "low", label: "Low risk", tone: "ok" },
  medium: { key: "medium", label: "Medium risk", tone: "warn" },
  high: { key: "high", label: "High risk", tone: "bad" },
};

// Same cut-offs as the backend: 80+ is low, 50-79 is medium, below 50 is high.
export function getRisk(score) {
  const value = Number(score) || 0;
  if (value >= 80) return LEVELS.low;
  if (value >= 50) return LEVELS.medium;
  return LEVELS.high;
}

// For the "Low" / "Medium" / "High" strings stored with each scan.
export function riskFromName(name) {
  return LEVELS[String(name || "").toLowerCase()] || LEVELS.high;
}

// Full class names (not built from pieces) so Tailwind can find them.
export const TONE = {
  ok: { text: "text-ok", bg: "bg-ok/12", border: "border-ok/40", solid: "bg-ok", rail: "border-l-ok" },
  warn: { text: "text-warn", bg: "bg-warn/12", border: "border-warn/40", solid: "bg-warn", rail: "border-l-warn" },
  bad: { text: "text-bad", bg: "bg-bad/12", border: "border-bad/40", solid: "bg-bad", rail: "border-l-bad" },
  info: { text: "text-info", bg: "bg-info/12", border: "border-info/40", solid: "bg-info", rail: "border-l-info" },
  muted: {
    text: "text-fg-muted",
    bg: "bg-surface-2",
    border: "border-line-strong",
    solid: "bg-fg-subtle",
    rail: "border-l-line-strong",
  },
};
