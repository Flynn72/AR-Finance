import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { LoadingState } from "./components/ui/StateViews";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Halaman di dalam aplikasi di-lazy-load per rute — supaya bundle awal
// (Login, shell) tetap kecil, dan tiap halaman baru diunduh saat benar-benar
// dibuka. Menjawab warning "chunk besar" yang muncul sejak Recharts/xlsx/jsPDF
// ditambahkan.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Invoices = lazy(() => import("./pages/ar-management/Invoices"));
const DisputeCenter = lazy(() => import("./pages/ar-management/DisputeCenter"));
const Collection = lazy(() => import("./pages/Collection"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingState label="Memuat halaman..." />
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route
              path="/ar-management/invoices"
              element={<Protected><Invoices /></Protected>}
            />
            <Route
              path="/ar-management/disputes"
              element={<Protected><DisputeCenter /></Protected>}
            />
            <Route path="/collection" element={<Protected><Collection /></Protected>} />
            <Route path="/customers" element={<Protected><Customers /></Protected>} />
            <Route
              path="/customers/:customerCode"
              element={<Protected><CustomerDetail /></Protected>}
            />
            <Route path="/reports" element={<Protected><Reports /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
