"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Plan a Trip" },
  { href: "/assistant", label: "Ask" },
  { href: "/chat", label: "Chat" },
  { href: "/trips", label: "My Trips" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync login state on every route change
  useEffect(() => {
    const syncMenu = window.setTimeout(() => {
      setLoggedIn(!!localStorage.getItem("access_token"));
      setMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(syncMenu);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    setLoggedIn(false);
    setMenuOpen(false);
    router.push("/login");
  }

  return (
    <header className="w-full border-b border-gray-100 bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-[#2196F3] tracking-tight"
        >
          KelanaAI
        </Link>

        {/* Nav links + avatar */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                isActive(href)
                  ? "bg-[#2196F3] text-white"
                  : "text-gray-500 hover:text-[#2196F3] hover:bg-[#e3f0fd]"
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Avatar dropdown — only when logged in */}
          {loggedIn && (
            <div className="relative ml-1" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Open user menu"
                aria-expanded={menuOpen}
                className="w-8 h-8 rounded-full bg-[#2196F3] text-white text-xs font-bold flex items-center justify-center hover:bg-[#1976D2] transition-colors duration-150 cursor-pointer select-none"
              >
                {/* Generic avatar icon — no name available at navbar level */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4Z" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-gray-100 shadow-lg overflow-hidden z-50">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-[#f0f4f8] transition-colors duration-150"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 text-gray-400"
                      aria-hidden="true"
                    >
                      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4Z" />
                    </svg>
                    Profile
                  </Link>

                  <div className="border-t border-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                      aria-hidden="true"
                    >
                      <path d="M16 13v-2H7V8l-5 4 5 4v-3h9Zm1-9H9a2 2 0 0 0-2 2v3h2V6h8v12H9v-3H7v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
