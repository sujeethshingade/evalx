export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-bold text-xl text-slate-100">EvalX</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
          <a href="/extract-marks" className="hover:text-white transition-colors">Extract Marks</a>
          <a href="/student-results" className="hover:text-white transition-colors">Student Results</a>
        </nav>
      </div>
    </header>
  );
}
