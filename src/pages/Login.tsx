import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserPlus, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import Button from "../components/ui/Button";
import { useAuthStore } from "../store/useAuthStore";

type Mode = "signin" | "signup";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSignupDone(false);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError("Email atau password salah.");
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setSubmitting(true);
    const { error, needsEmailConfirm } = await signUp(email, password);
    setSubmitting(false);

    if (error) {
      setError(error.includes("already registered") ? "Email ini sudah terdaftar. Coba masuk." : error);
      return;
    }

    if (needsEmailConfirm) {
      setSignupDone(true);
    } else {
      // Confirm-email dimatikan di Supabase — session langsung aktif
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-8">
        <div className="flex flex-col items-center text-center">
          <img src="/logo.png" alt="Accounts Receivable" className="h-14 w-14 object-contain" />
          <h1 className="mt-3 text-lg font-semibold text-brand-950">Accounts Receivable</h1>
          <p className="mt-1 text-sm text-brand-700">Masuk untuk mengakses dashboard internal Finance.</p>
        </div>

        <div className="mt-6 flex gap-1 rounded-[var(--radius-control)] bg-neutral-bg p-1">
          <button
            onClick={() => switchMode("signin")}
            className={clsx(
              "flex-1 rounded-[calc(var(--radius-control)-2px)] py-1.5 text-sm font-medium transition-colors",
              mode === "signin" ? "bg-white text-brand-950 shadow-sm" : "text-brand-700"
            )}
          >
            Masuk
          </button>
          <button
            onClick={() => switchMode("signup")}
            className={clsx(
              "flex-1 rounded-[calc(var(--radius-control)-2px)] py-1.5 text-sm font-medium transition-colors",
              mode === "signup" ? "bg-white text-brand-950 shadow-sm" : "text-brand-700"
            )}
          >
            Daftar
          </button>
        </div>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-brand-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-action hover:underline">
                  Lupa password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>

            {error && (
              <p className="rounded-[var(--radius-control)] bg-critical-bg px-3 py-2 text-xs text-critical-text">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={submitting} icon={<LogIn size={14} />}>
              {submitting ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        ) : signupDone ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-bg text-success-text">
              <CheckCircle2 size={22} />
            </div>
            <p className="mt-3 text-sm font-medium text-brand-950">Cek email Anda</p>
            <p className="mt-1 text-sm text-brand-700">
              Link konfirmasi sudah dikirim ke <strong>{email}</strong>. Klik link itu untuk
              mengaktifkan akun, lalu kembali ke sini untuk masuk.
            </p>
            <Button className="mt-4" variant="secondary" onClick={() => switchMode("signin")}>
              Kembali ke Masuk
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-brand-700">Konfirmasi Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
              />
            </div>

            {error && (
              <p className="rounded-[var(--radius-control)] bg-critical-bg px-3 py-2 text-xs text-critical-text">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={submitting} icon={<UserPlus size={14} />}>
              {submitting ? "Mendaftarkan..." : "Daftar Akun"}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-xs text-brand-700">
          Punya kendala masuk? Hubungi admin tim Finance.
        </p>
      </div>
    </div>
  );
}
