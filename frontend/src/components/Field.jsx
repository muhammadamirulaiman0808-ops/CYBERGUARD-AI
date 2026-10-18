import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// A labelled input with an optional icon, error text, hint, and a show/hide toggle for passwords.
export default function Field({ label, icon: Icon, error, hint, type = "text", className = "", ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg-muted">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
        )}
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={messageId}
          className={`input ${Icon ? "pl-10" : ""} ${isPassword ? "pr-11" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-fg-subtle hover:text-fg"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error ? (
        <p id={messageId} className="mt-1.5 text-sm text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
