import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Resolving the address",
  "Checking HTTPS and redirects",
  "Reading the TLS certificate",
  "Inspecting security headers",
  "Scoring the results",
];

// Steps advance on a timer. They show activity, not real progress (the scan is one request).
export default function LoadingScanner({ website }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((value) => Math.min(value + 1, STEPS.length - 1)), 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="panel scanline relative overflow-hidden p-6" role="status" aria-live="polite">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">Scan in progress</p>
      <p className="mt-1 break-all font-display text-xl font-semibold">{website}</p>
      <ul className="mt-5 space-y-2.5">
        {STEPS.map((label, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 text-sm ${done || active ? "text-fg" : "text-fg-subtle"}`}
            >
              <span className="grid h-5 w-5 place-items-center">
                {done ? (
                  <Check size={16} className="text-ok" aria-hidden="true" />
                ) : active ? (
                  <Loader2 size={16} className="animate-spin text-accent" aria-hidden="true" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
                )}
              </span>
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
