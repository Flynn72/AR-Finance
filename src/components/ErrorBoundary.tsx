import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "./ui/Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

/**
 * Menangkap error render yang tak tertangani supaya pengguna melihat pesan
 * yang jelas + tombol reload, bukan layar putih kosong tanpa keterangan.
 * Hanya menangkap error di pohon komponen React (render/lifecycle) —
 * bukan pengganti try/catch untuk operasi async (fetch, dsb).
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : "Terjadi kesalahan tak terduga." };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-critical-bg text-critical-text">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-base font-semibold text-brand-950">Terjadi kesalahan</p>
            <p className="mt-1 max-w-sm text-sm text-brand-700">
              Halaman mengalami error yang tidak terduga. Coba muat ulang — kalau masih
              bermasalah, hubungi admin.
            </p>
            {this.state.message && (
              <p className="mt-2 max-w-sm break-words font-data text-xs text-brand-700">
                {this.state.message}
              </p>
            )}
          </div>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Muat Ulang Halaman
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
