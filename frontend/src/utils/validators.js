// Client-side checks that mirror the backend rules, so people get feedback before sending.
// Each function returns an error message, or "" when the value is fine.

export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "An uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "A lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "A number", test: (v) => /[0-9]/.test(v) },
];

export function validateUsername(value) {
  const v = value.trim();
  if (v.length < 3) return "Username must be at least 3 characters";
  if (v.length > 30) return "Username must be 30 characters or fewer";
  if (!/^[A-Za-z0-9_.-]+$/.test(v)) return "Use only letters, numbers, dots, dashes and underscores";
  return "";
}

export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Enter a valid email address";
}

export function validatePassword(value) {
  const failed = PASSWORD_RULES.find((rule) => !rule.test(value));
  return failed ? `Password needs: ${failed.label.toLowerCase()}` : "";
}
