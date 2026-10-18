import Background from "./Background";
import Navbar from "./Navbar";
import FeedbackWidget from "./FeedbackWidget";
import Logo from "./Logo";

export default function Layout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Background />
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo className="text-fg-muted [&_span:last-child]:text-base" />
          <p>CyberGuard AI reads public information only: response headers and the TLS certificate.</p>
        </div>
      </footer>

      <FeedbackWidget />
    </div>
  );
}
