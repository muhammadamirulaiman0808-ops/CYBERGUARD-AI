import { CheckCircle2, Download, Info, ShieldAlert, XCircle } from "lucide-react";
import ScoreGauge from "./ScoreGauge";
import RiskBadge from "./RiskBadge";
import { TONE } from "../utils/risk";
import { formatDateTime } from "../utils/format";
import { downloadPDF } from "../utils/pdfReport";

const SEVERITY = {
  high: { tone: "bad", label: "High" },
  medium: { tone: "warn", label: "Medium" },
  low: { tone: "info", label: "Low" },
  info: { tone: "info", label: "Info" },
  pass: { tone: "ok", label: "Pass" },
};

const HEADER_NAMES = {
  HSTS: "Strict-Transport-Security",
  CSP: "Content-Security-Policy",
  Clickjacking: "X-Frame-Options",
  MIME: "X-Content-Type-Options",
  Referrer: "Referrer-Policy",
  Permissions: "Permissions-Policy",
};

function Section({ title, children }) {
  return (
    <section className="panel p-5 sm:p-6">
      <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">{title}</h3>
      {children}
    </section>
  );
}

function Status({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ok ? "text-ok" : "text-bad"}`}>
      {ok ? <CheckCircle2 size={15} aria-hidden="true" /> : <XCircle size={15} aria-hidden="true" />}
      {label}
    </span>
  );
}

export default function ScanResult({ result }) {
  const score = result.security_score ?? 0;
  const httpsOk = result.https === "Enabled";
  const ssl = result.ssl || {};
  const sslOk = ssl.status === "Valid";
  const headers = Object.entries(result.headers || {});
  const breakdown = result.score_breakdown || [];
  const findings = result.findings;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <section className="panel reticle p-5 sm:p-7">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ScoreGauge score={score} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-mono text-xs uppercase tracking-widest text-fg-subtle">Scan report</p>
            <h2 className="mt-1 break-all font-display text-2xl font-bold">{result.website}</h2>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <RiskBadge score={score} />
              {result.scanned_at && (
                <span className="font-mono text-xs text-fg-subtle">{formatDateTime(result.scanned_at)}</span>
              )}
            </div>
            {result.summary && <p className="mt-4 text-fg-muted">{result.summary}</p>}
            <button type="button" onClick={() => downloadPDF(result)} className="btn btn-ghost btn-sm mt-5">
              <Download size={14} />
              Download PDF
            </button>
          </div>
        </div>
      </section>

      {/* Checks */}
      <Section title="Checks">
        <ul className="divide-y divide-line">
          <li className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
            <div>
              <p className="font-medium">HTTPS</p>
              <p className="text-sm text-fg-subtle">
                {httpsOk ? "Served over an encrypted connection" : "Served over plain HTTP"}
              </p>
            </div>
            <Status ok={httpsOk} label={httpsOk ? "Enabled" : "Not secure"} />
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-medium">SSL certificate</p>
              <p className="text-sm text-fg-subtle">
                {sslOk
                  ? `Expires ${ssl.expiry}${typeof ssl.days_left === "number" ? ` (${ssl.days_left} days left)` : ""}`
                  : ssl.error || "No valid certificate found"}
              </p>
            </div>
            <Status ok={sslOk} label={ssl.status || "Unknown"} />
          </li>
          {headers.map(([key, status]) => (
            <li key={key} className="flex flex-wrap items-center justify-between gap-2 py-3 last:pb-0">
              <p className="break-all font-mono text-sm">{HEADER_NAMES[key] || key}</p>
              <Status ok={status === "Enabled"} label={status === "Enabled" ? "Set" : "Missing"} />
            </li>
          ))}
        </ul>
      </Section>

      {/* Findings */}
      {findings ? (
        <Section title="Findings">
          <ul className="space-y-3">
            {findings.map((finding, index) => {
              const sev = SEVERITY[finding.severity] || SEVERITY.info;
              const tone = TONE[sev.tone];
              return (
                <li
                  key={`${finding.title}-${index}`}
                  className={`rounded-[5px] border border-l-4 border-line bg-surface-2/50 p-4 ${tone.rail}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-mono text-xs font-medium uppercase ${tone.text}`}>{sev.label}</span>
                    <h4 className="font-medium">{finding.title}</h4>
                  </div>
                  {finding.detail && <p className="mt-1.5 text-sm text-fg-muted">{finding.detail}</p>}
                  {finding.fix && (
                    <p className="mt-2 text-sm">
                      <span className="font-medium text-accent">Fix: </span>
                      <span className="text-fg-muted">{finding.fix}</span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : (
        <>
          {result.analysis?.length > 0 && (
            <Section title="Analysis">
              <ul className="list-disc space-y-2 pl-5 text-fg-muted">
                {result.analysis.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Section>
          )}
          {result.recommendations?.length > 0 && (
            <Section title="Recommendations">
              <ul className="list-disc space-y-2 pl-5 text-fg-muted">
                {result.recommendations.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      {/* Exposed technology */}
      {result.exposed?.length > 0 && (
        <Section title="Exposed technology">
          <p className="mb-3 flex items-start gap-2 text-sm text-fg-muted">
            <ShieldAlert size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
            These headers tell visitors which software and versions the server runs.
          </p>
          <ul className="space-y-1.5">
            {result.exposed.map((line) => (
              <li key={line} className="break-all rounded bg-surface-2 px-3 py-1.5 font-mono text-xs">
                {line}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Score breakdown */}
      {breakdown.length > 0 && (
        <Section title="Score breakdown">
          <ul className="space-y-3">
            {breakdown.map((item) => (
              <li key={item.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-mono text-fg-muted">
                    {item.points} / {item.max}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={`h-full ${item.points === item.max ? "bg-ok" : item.points > 0 ? "bg-warn" : "bg-bad"}`}
                    style={{ width: `${(item.points / item.max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-xs text-fg-subtle">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            The scan reads public response headers and the TLS certificate. It does not test for vulnerabilities.
          </p>
        </Section>
      )}
    </div>
  );
}
