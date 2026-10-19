import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { ServicesPage } from "./pages/ServicesPage";
import { QuotationsPage } from "./pages/QuotationsPage";
import { QuotationBuilderPage } from "./pages/QuotationBuilderPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { InvoiceBuilderPage } from "./pages/InvoiceBuilderPage";
import { InvoiceViewPage } from "./pages/InvoiceViewPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { SuppliersPage } from "./pages/SuppliersPage";
import { AccountingPage } from "./pages/AccountingPage";
import { ReportsPage } from "./pages/ReportsPage";
import { StaffPage } from "./pages/StaffPage";
import { SettingsPage } from "./pages/SettingsPage";
import { VerifyInvoicePage } from "./pages/VerifyInvoicePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-navy-light border-t-brand-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-invoice/:hash" element={<VerifyInvoicePage />} />

            {/* Authenticated Application routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="quotations" element={<QuotationsPage />} />
              <Route path="quotations/new" element={<QuotationBuilderPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/new" element={<InvoiceBuilderPage />} />
              <Route path="invoices/:id" element={<InvoiceViewPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="accounting" element={<AccountingPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
