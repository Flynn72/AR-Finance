import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import Button from "../components/ui/Button";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Supabase mengarahkan user ke sini (redirectTo yang di-set di
 * requestPasswordReset) setelah klik link di email, dengan sesi sementara
 * yang khusus dipakai untuk ganti password lewat updateUser().
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] bg-brand-950 text-white">
            <KeyRound size={20} />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-brand-950">Buat Password Baru</h1>
          <p className="mt-1 text-sm text-brand-700">Masukkan password baru untuk akun Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-brand-700">Password Baru</label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
              placeholder="••••••••"
              className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
            />
          </div>

          {error && (
            <p className="rounded-[var(--radius-control)] bg-critical-bg px-3 py-2 text-xs text-critical-text">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
        </form>
      </div>
    </div>
  );
}
