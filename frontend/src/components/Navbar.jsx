import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Sun, User, X } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

const linkClass = ({ isActive }) =>
  `rounded-[5px] px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-accent/10 text-accent" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/");
  }

  const close = () => setOpen(false);

  const themeButton = (
    <button
      type="button"
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-[5px] border border-line-strong text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" onClick={close} aria-label="CyberGuard AI home">
          <Logo />
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/history" className={linkClass}>
                History
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <User size={14} />
                  {user.username}
                </span>
              </NavLink>
              <span className="mx-2 h-5 w-px bg-line-strong" aria-hidden="true" />
              {themeButton}
              <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm ml-1">
                <LogOut size={14} />
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm mx-1">
                Create account
              </Link>
              {themeButton}
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {themeButton}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-[5px] border border-line-strong text-fg"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav id="mobile-menu" className="border-t border-line bg-bg px-4 py-3 md:hidden" aria-label="Main">
          <div className="flex flex-col gap-1">
            {user ? (
              <>
                <NavLink to="/dashboard" className={linkClass} onClick={close}>
                  Dashboard
                </NavLink>
                <NavLink to="/history" className={linkClass} onClick={close}>
                  History
                </NavLink>
                <NavLink to="/profile" className={linkClass} onClick={close}>
                  Profile ({user.username})
                </NavLink>
                <button type="button" onClick={handleLogout} className="btn btn-ghost mt-2">
                  <LogOut size={14} />
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass} onClick={close}>
                  Log in
                </NavLink>
                <Link to="/register" className="btn btn-primary mt-2" onClick={close}>
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
