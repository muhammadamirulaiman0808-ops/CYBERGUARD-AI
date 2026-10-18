import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, User } from "lucide-react";
import Field from "../components/Field";
import API, { getErrorMessage } from "../api";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Login() {
  usePageTitle("Log in");
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const destination = location.state?.from || "/dashboard";
  if (user && !loading) return <Navigate to={destination} replace />;

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!form.username.trim() || !form.password) {
      setError("Enter your username or email and your password.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post("/login", { username: form.username.trim(), password: form.password });
      login(data.token, data.username);
      toast.success(`Welcome back, ${data.username}.`);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="panel reticle space-y-5 p-6 sm:p-8" noValidate>
        <div>
          <h1 className="font-display text-3xl font-bold">Log in</h1>
          <p className="mt-1 text-fg-muted">Use your username or email.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-[5px] border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
            {error}
          </p>
        )}

        <Field
          label="Username or email"
          icon={User}
          value={form.username}
          onChange={update("username")}
          autoComplete="username"
          autoFocus
        />
        <Field
          label="Password"
          icon={Lock}
          type="password"
          value={form.password}
          onChange={update("password")}
          autoComplete="current-password"
        />

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? "Logging in..." : "Log in"}
        </button>
        {loading && (
          <p className="text-center text-xs text-fg-subtle">
            The server may take up to a minute to wake up if it has been idle.
          </p>
        )}

        <p className="text-center text-sm text-fg-muted">
          No account yet?{" "}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
