import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight } from "lucide-react";
import ScanForm from "../components/ScanForm";
import LoadingScanner from "../components/LoadingScanner";
import ScanResult from "../components/ScanResult";
import AnimatedCard from "../components/AnimatedCard";
import RiskBadge from "../components/RiskBadge";
import API, { getErrorMessage } from "../api";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { formatDateTime } from "../utils/format";

function Stat({ label, value, tone = "" }) {
  return (
    <div className="panel px-5 py-4">
      <p className="font-mono text-xs uppercase tracking-widest text-fg-subtle">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const resultRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([API.get("/history/stats"), API.get("/history", { params: { limit: 5 } })])
      .then(([statsRes, listRes]) => {
        if (!active) return;
        setStats(statsRes.data);
        setRecent(listRes.data);
      })
      .catch(() => {
        // The stat strip is secondary. A failure here should not block scanning.
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function handleScan(url) {
    setLoading(true);
    setTarget(url);
    setError("");
    setResult(null);
    try {
      const { data } = await API.get("/full-scan", { params: { url } });
      setResult(data);
      setRefreshKey((value) => value + 1);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      const message = getErrorMessage(err, "The scan failed. Please try again.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Dashboard</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Hello, {user.username}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Scans" value={stats ? stats.total : "-"} />
        <Stat label="Average score" value={stats && stats.total ? stats.average : "-"} />
        <Stat label="Low risk" value={stats ? stats.low : "-"} tone="text-ok" />
        <Stat label="High risk" value={stats ? stats.high : "-"} tone="text-bad" />
      </div>

      <ScanForm onScan={handleScan} loading={loading} />

      {error && !loading && (
        <p role="alert" className="rounded-[5px] border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          {error}
        </p>
      )}

      {loading && <LoadingScanner website={target} />}

      {result && !loading && (
        <div ref={resultRef} className="scroll-mt-24">
          <AnimatedCard>
            <ScanResult result={result} />
          </AnimatedCard>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent scans</h2>
          {recent.length > 0 && (
            <Link to="/history" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              View all
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="panel px-5 py-8 text-center text-fg-muted">No scans yet. Scan a website above to get started.</p>
        ) : (
          <ul className="panel divide-y divide-line">
            {recent.map((scan) => (
              <li key={scan.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="break-all font-mono text-sm">{scan.website}</p>
                  <p className="text-xs text-fg-subtle">{formatDateTime(scan.date) || scan.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold tabular-nums">{scan.score}</span>
                  <RiskBadge risk={scan.risk} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
