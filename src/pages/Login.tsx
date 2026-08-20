import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, KeyRound } from "lucide-react";
import clsx from "clsx";
import Button from "../components/ui/Button";
import { useAuthStore } from "../store/useAuthStore";

type Mode = "password" | "otp";
type OtpStep = "request" | "verify";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, sendOtp, verifyOtp } = useAuthStore();

  const [mode, setMode] = useState<Mode>("password");

  // Password mode
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP mode
  const [otpStep, setOtpStep] = useState<OtpStep>("request");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordSubmit = async (e: FormEvent) => {
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

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await sendOtp(otpEmail);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    setOtpStep("verify");
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await verifyOtp(otpEmail, otpCode);
    setSubmitting(false);
    if (error) {
      setError("Kode salah atau sudah kedaluwarsa. Coba kirim ulang.");
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setOtpStep("request");
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
            onClick={() => switchMode("password")}
            className={clsx(
              "flex-1 rounded-[calc(var(--radius-control)-2px)] py-1.5 text-sm font-medium transition-colors",
              mode === "password" ? "bg-white text-brand-950 shadow-sm" : "text-brand-700"
            )}
          >
            Password
          </button>
          <button
            onClick={() => switchMode("otp")}
            className={clsx(
              "flex-1 rounded-[calc(var(--radius-control)-2px)] py-1.5 text-sm font-medium transition-colors",
              mode === "otp" ? "bg-white text-brand-950 shadow-sm" : "text-brand-700"
            )}
          >
            Kode Email (OTP)
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
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
        ) : (
          <div className="mt-5">
            {otpStep === "request" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-brand-700">
                  Belum punya akun? Masukkan email, kami kirim link masuk — akun baru otomatis
                  dibuat setelah link diklik.
                </p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-brand-700">Email</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
                  />
                </div>

                {error && (
                  <p className="rounded-[var(--radius-control)] bg-critical-bg px-3 py-2 text-xs text-critical-text">
                    {error}
                  </p>
                )}

                <Button type="submit" variant="primary" className="w-full" disabled={submitting} icon={<Mail size={14} />}>
                  {submitting ? "Mengirim..." : "Kirim Link Masuk"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center rounded-[var(--radius-control)] bg-info-bg px-4 py-5 text-center">
                  <Mail size={22} className="text-info-text" />
                  <p className="mt-2 text-sm font-medium text-brand-950">Cek email Anda</p>
                  <p className="mt-1 text-xs text-brand-700">
                    Link masuk sudah dikirim ke <strong>{otpEmail}</strong>. Buka email itu di
                    perangkat yang sama dengan yang Anda pakai sekarang, lalu klik tombol{" "}
                    <strong>"Sign in"</strong>. Cek folder spam kalau belum muncul.
                  </p>
                </div>

                <details className="rounded-[var(--radius-control)] border border-border-subtle px-3 py-2.5">
                  <summary className="cursor-pointer text-xs font-medium text-brand-700">
                    Menerima kode, bukan link?
                  </summary>
                  <form onSubmit={handleVerifyOtp} className="mt-3 space-y-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full rounded-[var(--radius-control)] border border-border-subtle px-3 py-2 text-center text-lg tracking-[0.5em] font-data focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full"
                      disabled={submitting || otpCode.length !== 6}
                      icon={<KeyRound size={14} />}
                    >
                      {submitting ? "Memverifikasi..." : "Verifikasi Kode"}
                    </Button>
                  </form>
                </details>

                {error && (
                  <p className="rounded-[var(--radius-control)] bg-critical-bg px-3 py-2 text-xs text-critical-text">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setOtpStep("request")}
                  className="w-full text-center text-xs font-medium text-action hover:underline"
                >
                  Ganti email / kirim ulang
                </button>
              </div>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-xs text-brand-700">
          Punya kendala masuk? Hubungi admin tim Finance.
        </p>
      </div>
    </div>
  );
}
