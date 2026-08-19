import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { LoadingState } from "../ui/StateViews";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingState label="Memeriksa sesi login..." />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
