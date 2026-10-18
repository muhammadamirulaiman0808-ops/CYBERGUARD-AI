import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Mail, User } from "lucide-react";
import Field from "../components/Field";
import PasswordStrength from "../components/PasswordStrength";
import API, { getErrorMessage } from "../api";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { validateEmail, validatePassword, validateUsername } from "../utils/validators";

export default function Register() {
  usePageTitle("Create account");
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user && !loading) return <Navigate to="/dashboard" replace />;

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const found = {
      username: validateUsername(form.username),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setLoading(true);
    const username = form.username.trim();
    const email = form.email.trim();
    try {
      await API.post("/register", { username, email, password: form.password });
      // Log in straight away so people do not have to type the same details twice.
      const { data } = await API.post("/login", { username, password: form.password });
      login(data.token, data.username);
      toast.success("Account created. Welcome to CyberGuard AI.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="panel reticle space-y-5 p-6 sm:p-8" noValidate>
        <div>
          <h1 className="font-display text-3xl font-bold">Create account</h1>
          <p className="mt-1 text-fg-muted">Free. Takes under a minute.</p>
        </div>

        {formError && (
          <p role="alert" className="rounded-[5px] border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
            {formError}
          </p>
        )}

        <Field
          label="Username"
          icon={User}
          value={form.username}
          onChange={update("username")}
          error={errors.username}
          autoComplete="username"
          autoFocus
        />
        <Field
          label="Email"
          icon={Mail}
          type="email"
          value={form.email}
          onChange={update("email")}
          error={errors.email}
          autoComplete="email"
        />
        <div>
          <Field
            label="Password"
            icon={Lock}
            type="password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
            autoComplete="new-password"
          />
          <PasswordStrength password={form.password} />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? "Creating account..." : "Create account"}
        </button>
        {loading && (
          <p className="text-center text-xs text-fg-subtle">
            The server may take up to a minute to wake up if it has been idle.
          </p>
        )}

        <p className="text-center text-sm text-fg-muted">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
