// Fixed decoration behind every page: a faint grid that fades out, and one soft glow.
export default function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="cyber-grid absolute inset-0" />
      <div className="absolute -top-48 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-[130px] dark:bg-accent/15" />
    </div>
  );
}
