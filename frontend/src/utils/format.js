export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// "https://www.example.com/path" -> "www.example.com"
export function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return String(url || "").replace(/^https?:\/\//, "").split("/")[0];
  }
}
