"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "Login failed.");
      return;
    }

    router.push(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34rem),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] px-6 text-slate-950">
      <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-2xl shadow-slate-300/70 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <LockKeyhole size={22} />
          </span>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-slate-400">Standup</p>
            <h1 className="text-2xl font-black tracking-tight">Sign in</h1>
          </div>
        </div>
        <div className="space-y-3">
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" autoComplete="username" className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" autoComplete="current-password" className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100" />
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p> : null}
        <button disabled={loading} className="mt-6 h-12 w-full rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
