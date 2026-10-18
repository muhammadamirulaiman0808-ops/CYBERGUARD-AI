import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Lock, Mail, User } from "lucide-react";
import Field from "../components/Field";
import PasswordStrength from "../components/PasswordStrength";
import API, { getErrorMessage } from "../api";
import { useAuth } from "../hooks/useAuth";
import { usePageTitle } from "../hooks/usePageTitle";
import { validateEmail, validatePassword, validateUsername } from "../utils/validators";

export default function Profile() {
  usePageTitle("Profile");
  const { setUsername } = useAuth();

  const [profile, setProfile] = useState({ username: "", email: "" });
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [profileErrors, setProfileErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    let active = true;
    API.get("/profile")
      .then((res) => {
        if (!active) return;
        setProfile({ username: res.data.username, email: res.data.email });
        setLoaded(true);
      })
      .catch((err) => {
        if (active) setLoadError(getErrorMessage(err, "Could not load your profile."));
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    const found = { username: validateUsername(profile.username), email: validateEmail(profile.email) };
    setProfileErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    try {
      const { data } = await API.put("/profile", {
        username: profile.username.trim(),
        email: profile.email.trim(),
      });
      setProfile({ username: data.username, email: data.email });
      // The token identifies the user by id, so the session stays valid after a rename.
      setUsername(data.username);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    const found = {
      current: pw.current ? "" : "Enter your current password",
      next: validatePassword(pw.next),
    };
    setPwErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setChanging(true);
    try {
      await API.put("/profile/password", { current_password: pw.current, new_password: pw.next });
      setPw({ current: "", next: "" });
      toast.success("Password changed.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent">Account</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Profile</h1>
      </div>

      {loadError && (
        <p role="alert" className="rounded-[5px] border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          {loadError}
        </p>
      )}

      <form onSubmit={saveProfile} className="panel space-y-5 p-6" noValidate>
        <h2 className="font-display text-lg font-semibold">Details</h2>
        <Field
          label="Username"
          icon={User}
          value={profile.username}
          onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
          error={profileErrors.username}
          disabled={!loaded}
          autoComplete="username"
        />
        <Field
          label="Email"
          icon={Mail}
          type="email"
          value={profile.email}
          onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
          error={profileErrors.email}
          disabled={!loaded}
          autoComplete="email"
        />
        <button type="submit" disabled={!loaded || saving} className="btn btn-primary">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <form onSubmit={changePassword} className="panel space-y-5 p-6" noValidate>
        <h2 className="font-display text-lg font-semibold">Change password</h2>
        <Field
          label="Current password"
          icon={Lock}
          type="password"
          value={pw.current}
          onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
          error={pwErrors.current}
          autoComplete="current-password"
        />
        <div>
          <Field
            label="New password"
            icon={Lock}
            type="password"
            value={pw.next}
            onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
            error={pwErrors.next}
            autoComplete="new-password"
          />
          <PasswordStrength password={pw.next} />
        </div>
        <button type="submit" disabled={changing} className="btn btn-primary">
          {changing ? "Changing..." : "Change password"}
        </button>
      </form>
    </div>
  );
}
