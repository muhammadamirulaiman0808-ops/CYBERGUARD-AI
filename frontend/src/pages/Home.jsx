import { Link } from "react-router-dom";
import { ArrowRight, Lock, ScanSearch, ShieldCheck } from "lucide-react";
import ScanTrace from "../components/ScanTrace";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";

const CHECKS = [
  { name: "HTTPS", points: 25, text: "Is the site served over an encrypted connection?" },
  { name: "SSL certificate", points: 25, text: "Is the certificate valid, trusted and not about to expire?" },
  { name: "Strict-Transport-Security", points: 12, text: "Does the browser stay on HTTPS on later visits?" },
  { name: "Content-Security-Policy", points: 12, text: "Does the site limit where scripts and content can load from?" },
  { name: "X-Frame-Options", points: 10, text: "Can another site embed this one to trick visitors?" },
  { name: "X-Content-Type-Options", points: 6, text: "Is the browser stopped from guessing file types?" },
  { name: "Referrer-Policy", points: 5, text: "How much address information leaks to other sites?" },
  { name: "Permissions-Policy", points: 5, text: "Which browser features can the page use?" },
];

const STEPS = [
  { icon: ScanSearch, title: "Enter a website", text: "Type any public address. No install, no agent." },
  { icon: Lock, title: "We read the public signals", text: "Redirects, TLS certificate and response headers." },
  { icon: ShieldCheck, title: "Get a score and a fix list", text: "Every problem comes with what to change." },
];

export default function Home() {
  usePageTitle("");
  const { user } = useAuth();

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">Website security scanner</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] sm:text-6xl">
            See how safe a website looks <span className="text-accent">from the outside.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-fg-muted">
            CyberGuard AI checks HTTPS, the SSL certificate and six security headers, then gives a score out of 100
            and a list of fixes ordered by how much they matter.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary">
              {user ? "Open dashboard" : "Create free account"}
              <ArrowRight size={16} />
            </Link>
            {!user && (
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
            )}
          </div>
        </div>
        <ScanTrace />
      </section>

      {/* Checks ledger */}
      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">What gets checked</p>
        <h2 className="mt-2 font-display text-3xl font-bold">100 points, split across 8 checks</h2>
        <ul className="panel mt-8 divide-y divide-line">
          {CHECKS.map((check) => (
            <li key={check.name} className="flex items-center gap-4 px-5 py-4">
              <span className="w-12 shrink-0 font-display text-2xl font-bold text-accent tabular-nums">
                {check.points}
              </span>
              <div className="min-w-0">
                <p className="break-all font-mono text-sm font-medium">{check.name}</p>
                <p className="text-sm text-fg-muted">{check.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-fg-subtle">
          80 and above is low risk, 50 to 79 is medium risk, below 50 is high risk.
        </p>
      </section>

      {/* Steps */}
      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">How it works</p>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="panel p-6">
              <div className="flex items-center justify-between">
                <step.icon size={22} className="text-accent" aria-hidden="true" />
                <span className="font-mono text-sm text-fg-subtle">0{index + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-fg-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      {!user && (
        <section className="panel reticle p-8 text-center sm:p-12">
          <h2 className="font-display text-3xl font-bold">Scan your first website</h2>
          <p className="mx-auto mt-3 max-w-lg text-fg-muted">
            Create an account to run scans and keep a history you can compare over time.
          </p>
          <Link to="/register" className="btn btn-primary mt-6">
            Get started
            <ArrowRight size={16} />
          </Link>
        </section>
      )}
    </div>
  );
}
