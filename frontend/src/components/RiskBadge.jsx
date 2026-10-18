import { TONE, getRisk, riskFromName } from "../utils/risk";

// Pass `risk` ("Low" / "Medium" / "High" as stored) or a numeric `score`.
export default function RiskBadge({ risk, score, className = "" }) {
  const level = risk ? riskFromName(risk) : getRisk(score);
  const tone = TONE[level.tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 font-mono text-xs font-medium ${tone.text} ${tone.bg} ${tone.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.solid}`} aria-hidden="true" />
      {level.label}
    </span>
  );
}
