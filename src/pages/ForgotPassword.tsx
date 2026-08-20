import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Button from "../components/ui/Button";
import { useAuthStore } from "../store/useAuthStore";

export default function ForgotPassword() {
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await requestPasswordReset(email);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border-subtle bg-surface-card p-8">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-950">
          <ArrowLeft size={14} />
          Kembali ke Login
        </Link>

        {sent ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-bg text-success-text">
              <CheckCircle2 size={22} />
            </div>
            <p className="mt-3 text-sm font-medium text-brand-950">Link reset terkirim</p>
            <p className="mt-1 text-sm text-brand-700">
              Cek email <strong>{email}</strong> untuk link reset password. Kalau tidak muncul,
              cek folder spam.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-4 text-lg font-semibold text-brand-950">Lupa Password</h1>
            <p className="mt-1 text-sm text-brand-700">
              Masukkan email akun Anda, kami akan kirim link untuk membuat password baru.
            </p>

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

              {error && (
                <p className="rounded-[var(--radius-control)] bg-critical-bg px-3 py-2 text-xs text-critical-text">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full" disabled={submitting} icon={<Mail size={14} />}>
                {submitting ? "Mengirim..." : "Kirim Link Reset"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
