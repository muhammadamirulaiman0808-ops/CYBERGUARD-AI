import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";

// A fixed sample, shown on the home page. It is an illustration, not a live scan.
const ROWS = [
  { name: "HTTPS", ok: true, points: "25/25" },
  { name: "SSL certificate", ok: true, points: "25/25" },
  { name: "Strict-Transport-Security", ok: true, points: "12/12" },
  { name: "Content-Security-Policy", ok: false, points: "0/12" },
  { name: "X-Frame-Options", ok: true, points: "10/10" },
  { name: "X-Content-Type-Options", ok: true, points: "6/6" },
  { name: "Referrer-Policy", ok: false, points: "0/5" },
  { name: "Permissions-Policy", ok: false, points: "0/5" },
];

export default function ScanTrace() {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? ROWS.length : 0);

  useEffect(() => {
    if (reduce) return undefined;
    const timer = setInterval(() => {
      setShown((value) => {
        if (value >= ROWS.length) {
          clearInterval(timer);
          return value;
        }
        return value + 1;
      });
    }, 380);
    return () => clearInterval(timer);
  }, [reduce]);

  const done = shown >= ROWS.length;

  return (
    <div className="panel reticle p-5 font-mono text-sm" aria-label="Sample scan result">
      <div className="mb-4 flex items-center justify-between text-xs">
        <span className="text-fg-subtle">sample.example.com</span>
        <span className="text-accent">sample</span>
      </div>
      <ul className="space-y-2">
        {ROWS.slice(0, shown).map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 truncate">
              {row.ok ? (
                <Check size={14} className="shrink-0 text-ok" aria-hidden="true" />
              ) : (
                <X size={14} className="shrink-0 text-bad" aria-hidden="true" />
              )}
              <span className="truncate">{row.name}</span>
            </span>
            <span className={row.ok ? "text-ok" : "text-bad"}>{row.points}</span>
          </li>
        ))}
        {!done && <li className="h-5 text-accent">_</li>}
      </ul>
      <div
        className={`mt-4 flex items-center justify-between border-t border-line pt-4 transition-opacity duration-500 ${
          done ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-fg-muted">Score</span>
        <span className="font-display text-xl font-bold text-warn">78 / 100 - Medium risk</span>
      </div>
    </div>
  );
}
