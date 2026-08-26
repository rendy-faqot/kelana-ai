export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-100 bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-center">
        <p className="text-xs text-gray-400">
          {year} · Alkademi x MAIN — Phase 2
        </p>
      </div>
    </footer>
  );
}
