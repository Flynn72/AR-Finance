import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/ar-management/Invoices";
import DisputeCenter from "./pages/ar-management/DisputeCenter";
import Collection from "./pages/Collection";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
  );
}
