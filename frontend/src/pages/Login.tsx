import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePageMeta } from "../hooks/usePageMeta";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500";
const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400";

export function Login() {
  usePageMeta(
    "Log In or Sign Up",
    "Sign in to sync your saved jobs, CV, and application tracker across devices."
  );

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      showToast(mode === "login" ? "Welcome back!" : "Account created");
      navigate("/");
    } catch (err) {
      if (mode === "login") {
        setError("Couldn't log in — check your email and password.");
      } else if (err instanceof Error && err.message.includes("400")) {
        setError("That email is already registered.");
      } else if (err instanceof Error && err.message.includes("422")) {
        setError("Password must be at least 8 characters.");
      } else {
        setError("Couldn't create your account right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="grid overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.03] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none md:grid-cols-2">
        <img
          src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80"
          alt=""
          className="hidden h-full w-full object-cover md:block"
        />

        <div className="p-8">
          <header className="space-y-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Account
            </span>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-50">
              {mode === "login" ? "Log in" : "Create an account"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mode === "login"
                ? "Sync your saved jobs and CV across devices."
                : "Save your jobs and CV to your account, not just this device."}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <div className="space-y-1">
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "signup" && (
                <p className="text-xs text-gray-400 dark:text-gray-500">At least 8 characters.</p>
              )}
            </div>

            {error && (
              <motion.p
                initial={{ x: 0 }}
                animate={{ x: [0, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.35 }}
                className="text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-transform hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
