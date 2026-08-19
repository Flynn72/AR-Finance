import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, LogIn } from "lucide-react";
import Button from "../components/ui/Button";
import { useAuthStore } from "../store/useAuthStore";

export default function Login() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError("Email atau password salah. Hubungi admin jika Anda belum memiliki akun.");
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] bg-brand-950 text-white">
            <Landmark size={20} />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-brand-950">Accounts Receivable</h1>
          <p className="mt-1 text-sm text-brand-700">Masuk untuk mengakses dashboard internal Finance.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-700">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
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

        <p className="mt-5 text-center text-xs text-brand-700">
          Akun dibuat oleh admin lewat Supabase Dashboard — tidak ada pendaftaran mandiri.
        </p>
      </div>
    </div>
  );
}
