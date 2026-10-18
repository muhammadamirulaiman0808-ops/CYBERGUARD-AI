import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-display text-7xl font-bold text-accent">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-fg-muted">That address does not lead anywhere.</p>
      <Link to="/" className="btn btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
