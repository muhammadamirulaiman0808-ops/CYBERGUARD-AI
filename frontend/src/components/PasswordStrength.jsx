import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "../utils/validators";

// Shows which password rules are met. The bar adds a fifth, optional point for a symbol.
export default function PasswordStrength({ password }) {
  if (!password) return null;

  const met = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const points = met + (hasSymbol && met === PASSWORD_RULES.length ? 1 : 0);

  const level =
    points <= 2
      ? { label: "Weak", bar: "bg-bad", text: "text-bad" }
      : points <= 4
        ? { label: "Okay", bar: "bg-warn", text: "text-warn" }
        : { label: "Strong", bar: "bg-ok", text: "text-ok" };

  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className={`h-full ${level.bar} transition-all duration-300`}
            style={{ width: `${(points / (PASSWORD_RULES.length + 1)) * 100}%` }}
          />
        </div>
        <span className={`font-mono text-xs ${level.text}`}>{level.label}</span>
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className={`flex items-center gap-1.5 ${ok ? "text-ok" : "text-fg-subtle"}`}>
              {ok ? <Check size={12} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
