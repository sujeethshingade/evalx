"use client";

import React, { useState, Suspense, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  ArrowRight,
  Loader2,
  CheckCircle,
  ShieldCheck,
  Lock,
} from "lucide-react";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Memoized email input component
const EmailInput = memo<{
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}>(({ value, onChange, disabled = false }) => (
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
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl outline-none text-white transition-all placeholder:text-slate-600 disabled:opacity-50"
        placeholder="you@university.edu"
      />
    </div>
  </div>
));

EmailInput.displayName = "EmailInput";

// Memoized password input component
const PasswordInput = memo<{
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}>(({ value, onChange, disabled = false }) => (
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
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl outline-none text-white transition-all placeholder:text-slate-600 disabled:opacity-50"
        placeholder="Your password"
      />
    </div>
  </div>
));

PasswordInput.displayName = "PasswordInput";

// Memoized OTP input component
const OTPInput = memo<{
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}>(({ value, onChange, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">
      Authentication Code
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <KeyRound className="h-5 w-5 text-slate-500" />
      </div>
      <input
        type="text"
        required
        disabled={disabled}
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-xl outline-none text-white transition-all placeholder:text-slate-600 tracking-[0.5em] font-mono text-center disabled:opacity-50"
        placeholder="000000"
      />
    </div>
  </div>
));

OTPInput.displayName = "OTPInput";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("from") || "/student-results";

  const [step, setStep] = useState<"login" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");
    try {
      await axios.post("/api/auth/login", { email, password });
      setSuccessMsg("Logged in successfully. Redirecting...");
      setTimeout(() => {
        router.refresh();
        router.push(redirectPath);
      }, 800);
    } catch (err: unknown) {
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 403 &&
        err.response?.data?.needsVerification
      ) {
        setStep("otp");
        setSuccessMsg("Please verify your email. We sent a 6-digit OTP.");
      } else {
        setError(
          axios.isAxiosError(err)
            ? (err.response?.data?.message as string) || "Something went wrong."
            : "Something went wrong.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError("");
    try {
      await axios.post("/api/auth/verify-otp", { email, otp });
      setSuccessMsg("Authenticated successfully! Redirecting...");
      setTimeout(() => {
        router.refresh();
        router.push(redirectPath);
      }, 1000);
    } catch (err: unknown) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message as string) || "Invalid or expired OTP."
          : "Invalid or expired OTP.",
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
            {/* Background Flair */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl z-0 pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl z-0 pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-slate-400">
                  Sign in or create an account to continue
                </p>
              </div>

              <AnimatePresence mode="wait">
                {step === "login" ? (
                  <motion.form
                    key="login-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleLogin}
                    className="space-y-6"
                  >
                    <EmailInput
                      value={email}
                      onChange={setEmail}
                      disabled={loading}
                    />

                    <PasswordInput
                      value={password}
                      onChange={setPassword}
                      disabled={loading}
                    />

                    {error && (
                      <p className="text-sm text-red-400 font-medium text-center">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email || !password}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-900/20 disabled:shadow-none"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Login{" "}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-sm text-slate-400">
                      Don&apos;t have an account?{" "}
                      <Link
                        href="/signup"
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Create one
                      </Link>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form
                    key="otp-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-6"
                  >
                    <div className="text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 rounded-xl text-sm font-medium mb-6 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> {successMsg}
                    </div>

                    <OTPInput
                      value={otp}
                      onChange={setOtp}
                      disabled={loading}
                    />

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
                        "Verify & Login"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep("login")}
                      className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors py-2"
                    >
                      Back to email/password login
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
