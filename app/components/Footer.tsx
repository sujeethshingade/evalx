export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/50 py-4 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <span>&copy; {new Date().getFullYear()} EvalX. All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <span>Developed by <a href="https://sujeethshingade.dev" className="hover:text-slate-300 transition-colors">Sujeeth Shingade.</a></span>
        </div>
      </div>
    </footer>
  );
}
