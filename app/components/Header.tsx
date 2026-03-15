"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard" className="font-bold text-xl text-slate-100">EvalX</Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/extract-marks" className="hover:text-white transition-colors">Extract Marks</Link>
          <Link href="/student-results" className="hover:text-white transition-colors">Student Results</Link>
        </nav>

        {/* Mobile Hamburger Icon */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950/80 border-b border-slate-800">
          <nav className="flex flex-col px-4 pt-2 pb-4 space-y-3 text-sm border-t font-medium text-slate-300">
            <Link 
              href="/dashboard" 
              className="hover:text-white transition-colors block py-2 border-b border-slate-800/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/extract-marks" 
              className="hover:text-white transition-colors block py-2 border-b border-slate-800/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Extract Marks
            </Link>
            <Link 
              href="/student-results" 
              className="hover:text-white transition-colors block py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Student Results
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
