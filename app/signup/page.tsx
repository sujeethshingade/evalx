"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  KeyRound,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<"signup" | "otp">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/signup", { email, password });
      setSuccessMsg("OTP sent to your email.");
      setStep("otp");
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message as string) || "Signup failed."
          : "Signup failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/auth/verify-otp", { email, otp });
      setSuccessMsg("Account verified. Redirecting to Dashboard...");
      setTimeout(() => router.push("/dashboard"), 900);
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message as string) || "Invalid OTP."
          : "Invalid OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-blue-500/30">
      <Header />
      <main className="grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8 shadow-2xl border border-slate-800/60 relative overflow-hidden"
          >
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl z-0 pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl z-0 pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Create Account
                </h1>
                <p className="text-slate-400">
                  Use OTP once for first-time email verification
                </p>
              </div>

              {step === "signup" ? (
                <form onSubmit={handleSignup} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl outline-none text-white transition-all placeholder:text-slate-600"
                        placeholder="you@university.edu"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl outline-none text-white transition-all placeholder:text-slate-600"
                        placeholder="At least 8 characters"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl outline-none text-white transition-all placeholder:text-slate-600"
                        placeholder="Repeat your password"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 font-medium text-center">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      loading || !email || !password || !confirmPassword
                    }
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-900/20 disabled:shadow-none"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Sign Up{" "}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Login
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 rounded-xl text-sm font-medium mb-2 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {successMsg}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">
                      Verification OTP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl outline-none text-white transition-all placeholder:text-slate-600 tracking-[0.5em] font-mono text-center"
                        placeholder="000000"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 font-medium text-center">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:shadow-none"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Verify Account"
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
