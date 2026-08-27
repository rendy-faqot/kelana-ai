"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Plan a Trip" },
  { href: "/trips", label: "My Trips" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function isLoggedIn() {
    return !!localStorage.getItem("access_token");
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
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

        {/* Nav links + logout */}
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

          {isLoggedIn() && (
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
