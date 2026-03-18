"use client";

import { useState } from "react";
import Link from "next/link";
import { Ghost } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";

const JOKES = [
  "404: Brain not found. Please try again after coffee.",
  "This page is like my motivation on Monday—missing.",
  "I asked ChatGPT where this page is. Even it said '404'.",
  "Have you tried turning the internet off and on again?",
  "git commit -m 'fixed 404'... wait, still broken.",
  "This page went to production on Friday evening.",
  "Looks like the developer said: 'works on my machine'.",
  "You found a hidden level! Unfortunately, it's empty.",
  "The page is in another repository.",
  "StackOverflow says this error is duplicated somewhere.",
  "The page escaped the try/catch block.",
  "Error 404: Intern forgot to deploy this page.",
  "This link is more broken than my sleep schedule.",
  "The page is currently debugging itself.",
  "Maybe the page rage-quit the server.",
  "I searched the database... nothing returned.",
  "The page is on vacation. No ETA.",
  "Even Google couldn't find this page.",
];

export default function NotFound() {
  const [joke] = useState(
    () => JOKES[Math.floor(Math.random() * JOKES.length)],
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="grow flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-slate-950">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />

        <div className="z-10 flex flex-col items-center text-center max-w-lg">
          <div className="mb-6 inline-flex p-4 shadow-xl">
            <Ghost className="w-12 h-12 text-blue-400" />
          </div>

          <h1 className="text-8xl font-black text-white/90 mb-2 select-none">
            404
          </h1>

          <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-4">
            You&apos;ve hit a dead end!
          </h2>

          <div className="min-h-12 mb-10 flex items-center justify-center">
            <p className="text-slate-400 text-lg italic animate-pulse">
              {joke}
            </p>
          </div>

          <div className="flex flex-col items-center sm:flex-row gap-4">
            <Link
              href="/student-results"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-2"
            >
              Back to Student Results
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="px-13 py-3.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all border border-slate-700 active:scale-95 flex items-center gap-2"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
