import { ShieldCheck } from "lucide-react";

export default function Logo({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-display ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-[5px] border border-accent/50 bg-accent/10 text-accent">
        <ShieldCheck size={18} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight">
        CyberGuard <span className="text-accent">AI</span>
      </span>
    </span>
  );
}
