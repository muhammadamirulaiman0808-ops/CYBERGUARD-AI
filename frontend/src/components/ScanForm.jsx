import { useState } from "react";
import { Globe, Radar } from "lucide-react";

export default function ScanForm({ onScan, loading }) {
  const [url, setUrl] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const value = url.trim();
    if (value && !loading) onScan(value);
  }

  return (
    <form onSubmit={handleSubmit} className="panel reticle p-5 sm:p-6">
      <label htmlFor="scan-url" className="mb-2 block font-mono text-xs uppercase tracking-widest text-accent">
        Target
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Globe
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
          <input
            id="scan-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck="false"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="example.com"
            disabled={loading}
            className="input pl-10 font-mono"
          />
        </div>
        <button type="submit" disabled={loading || !url.trim()} className="btn btn-primary sm:w-40">
          <Radar size={16} />
          {loading ? "Scanning..." : "Scan website"}
        </button>
      </div>
      <p className="mt-3 text-xs text-fg-subtle">
        Only scan sites you own or have permission to test. Public websites only.
      </p>
    </form>
  );
}
