"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Database,
  Shield,
  Zap,
  Sparkles,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Home() {
  const [pingingCards, setPingingCards] = useState<Record<number, boolean>>({});
  const [statsPinged, setStatsPinged] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <Header />

      <main className="grow relative overflow-hidden flex flex-col items-center">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        {/* Hero Section */}
        <section className="w-full relative py-24 md:py-36 px-4 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl mx-auto flex flex-col items-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-blue-300 text-xs md:text-sm font-medium mb-8 backdrop-blur-sm animate-pulse"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>EvalX is now live and blazing fast</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-[1.1]">
              Effortless Data <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-blue-400 to-emerald-400">
                Extraction at Scale
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              Transform unstructured PDF result sheets into clean, structured
              Excel data in seconds. Built for speed, accuracy, and edge-native
              performance.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
            >
              <Link
                href="/extract-marks"
                className="px-8 py-4 w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-100 font-semibold rounded-2xl transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-95 flex items-center justify-center gap-2 group"
              >
                Start Extracting
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/student-results"
                className="px-8 py-4 w-full sm:w-auto bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md text-white font-semibold rounded-2xl transition-all border border-slate-700 hover:border-slate-600 active:scale-95 flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5 text-blue-400" />
                View Results
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="w-full py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Zap className="w-6 h-6 text-amber-400" />,
                  title: "Lightning Fast Engine",
                  desc: "Processes large sets of PDFs concurrently leveraging Vercel's serverless edge infrastructure.",
                },
                {
                  icon: <Database className="w-6 h-6 text-blue-400" />,
                  title: "AG Grid Integration",
                  desc: "Interactive data tables allowing sorting, filtering, and instant exports straight to Excel.",
                },
                {
                  icon: <Shield className="w-6 h-6 text-emerald-400" />,
                  title: "Zero-Retention Policy",
                  desc: "Files are processed strictly in-memory. Zero data is written to disk ensuring absolute privacy.",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    delay: idx * 0.2,
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                  onHoverStart={() =>
                    setPingingCards((prev) => ({ ...prev, [idx]: true }))
                  }
                  className={
                    "bg-slate-950/50 border border-slate-800 p-8 rounded-4xl transition-colors group"
                  }
                >
                  <div className="w-14 h-14 bg-slate-900 border border-slate-700/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed font-light">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="w-full py-12 px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            onHoverStart={() => setStatsPinged(true)}
            className={
              "max-w-6xl mx-auto rounded-4xl p-12 md:p-16 relative overflow-hidden border border-slate-800 shadow-2xl"
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-center items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              >
                <div className="text-5xl font-black text-white/90 mb-2 tracking-tighter">
                  ₹0
                </div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                  Cost
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              >
                <div className="text-5xl font-black text-white/90 mb-2 tracking-tighter">
                  &lt;5s
                </div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                  Extraction
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
              >
                <div className="text-5xl font-black text-white/90 mb-2 tracking-tighter">
                  100%
                </div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                  Serverless
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
              >
                <div className="flex flex-col items-center justify-center">
                  <Activity className="w-10 h-10 text-white/90 mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                    System Online
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
