import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Eye, Search, Trash2 } from "lucide-react";
import Modal from "../components/Modal";
import RiskBadge from "../components/RiskBadge";
import ScanResult from "../components/ScanResult";
import API, { getErrorMessage } from "../api";
import { usePageTitle } from "../hooks/usePageTitle";
import { riskFromName } from "../utils/risk";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

export default function History() {
  usePageTitle("History");
  const [scans, setScans] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null); // { title, result } or { title, loading } or { title, error }
  const [confirm, setConfirm] = useState(null); // { type: "one", scan } or { type: "all" }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    API.get("/history", { params: { limit: 500 } })
      .then((res) => {
        if (!active) return;
        setScans(res.data);
        setLoadError("");
      })
      .catch((err) => {
        if (active) setLoadError(getErrorMessage(err, "Could not load your history."));
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const visible = useMemo(() => {
    if (!scans) return [];
    const term = query.trim().toLowerCase();
    return scans.filter(
      (scan) =>
        (filter === "all" || riskFromName(scan.risk).key === filter) &&
        (!term || scan.website.toLowerCase().includes(term)),
    );
  }, [scans, query, filter]);

  function openDetail(scan) {
    setDetail({ title: scan.website, loading: true });
    API.get(`/history/${scan.id}`)
      .then((res) => {
        const result = res.data.result;
        setDetail(
          result
            ? { title: scan.website, result }
            : { title: scan.website, error: "No saved details for this scan." },
        );
      })
      .catch((err) => setDetail({ title: scan.website, error: getErrorMessage(err) }));
  }

  async function confirmDelete() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.type === "all") {
        await API.delete("/history");
        toast.success("History cleared.");
      } else {
        await API.delete(`/history/${confirm.scan.id}`);
        toast.success("Scan deleted.");
      }
      setConfirm(null);
      setReloadKey((value) => value + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">History</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Past scans</h1>
        </div>
        {scans?.length > 0 && (
          <button type="button" onClick={() => setConfirm({ type: "all" })} className="btn btn-danger btn-sm">
            <Trash2 size={14} />
            Clear all
          </button>
        )}
      </div>

      {loadError && (
        <div role="alert" className="rounded-[5px] border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          {loadError}{" "}
          <button type="button" className="font-medium underline" onClick={() => setReloadKey((v) => v + 1)}>
            Try again
          </button>
        </div>
      )}

      {scans === null && !loadError && <p className="text-fg-muted">Loading your scans...</p>}

      {scans?.length === 0 && (
        <p className="panel px-5 py-10 text-center text-fg-muted">No scans yet. Run one from the dashboard.</p>
      )}

      {scans?.length > 0 && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by website"
                aria-label="Search by website"
                className="input pl-10"
              />
            </div>
            <div className="flex gap-1" role="group" aria-label="Filter by risk">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  aria-pressed={filter === item.key}
                  className={`rounded-[5px] border px-3 py-2 text-sm font-medium transition-colors ${
                    filter === item.key
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-line-strong text-fg-muted hover:bg-surface-2"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="panel px-5 py-8 text-center text-fg-muted">No scans match your search.</p>
          ) : (
            <ul className="panel divide-y divide-line">
              {visible.map((scan) => (
                <li key={scan.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="break-all font-mono text-sm">{scan.website}</p>
                    <p className="text-xs text-fg-subtle">{scan.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 text-right font-display text-lg font-bold tabular-nums">{scan.score}</span>
                    <RiskBadge risk={scan.risk} />
                    <button
                      type="button"
                      onClick={() => openDetail(scan)}
                      className="btn btn-ghost btn-sm"
                      aria-label={`View scan of ${scan.website}`}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ type: "one", scan })}
                      className="grid h-8 w-8 place-items-center rounded text-fg-subtle hover:bg-bad/10 hover:text-bad"
                      aria-label={`Delete scan of ${scan.website}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.title || ""} wide>
        {detail?.loading && <p className="text-fg-muted">Loading...</p>}
        {detail?.error && <p className="text-bad">{detail.error}</p>}
        {detail?.result && <ScanResult result={detail.result} />}
      </Modal>

      <Modal
        open={Boolean(confirm)}
        onClose={() => !busy && setConfirm(null)}
        title={confirm?.type === "all" ? "Clear all history?" : "Delete this scan?"}
      >
        <p className="text-fg-muted">
          {confirm?.type === "all"
            ? "Every saved scan will be removed. This cannot be undone."
            : `The scan of ${confirm?.scan?.website} will be removed. This cannot be undone.`}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setConfirm(null)} disabled={busy} className="btn btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} disabled={busy} className="btn btn-danger">
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
