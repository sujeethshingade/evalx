"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const { data } = await axios.get("/api/auth/me");
        setAuthenticated(Boolean(data?.authenticated));
      } catch {
        setAuthenticated(false);
      }
    };

    fetchAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch {
      // Best-effort logout.
    }
    setAuthenticated(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center min-w-24">
          <Link href="/" className="font-bold text-2xl text-slate-100">
            EvalX
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300 absolute left-1/2 -translate-x-1/2">
          <Link 
            href="/dashboard" 
            className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link
            href="/extract-marks"
            className="hover:text-white transition-colors">
            Extract Marks
          </Link>
          <Link
            href="/student-results"
            className="hover:text-white transition-colors">
            Student Results
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {authenticated ? (
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors text-sm"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors text-sm"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm"
              >
                Signup
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Icon */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950/80 border-b border-slate-800">
          <nav className="flex flex-col px-4 pt-2 pb-4 space-y-3 text-sm border-t font-medium text-slate-300">
            <Link
              href="/"
              className="hover:text-white transition-colors block py-2 border-b border-slate-800/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/extract-marks"
              className="hover:text-white transition-colors block py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Extract Marks
            </Link>
            {authenticated ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-left hover:text-white transition-colors block py-2 border-t border-slate-800/50"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-white transition-colors block py-2 border-t border-slate-800/50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="hover:text-white transition-colors block py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Signup
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
