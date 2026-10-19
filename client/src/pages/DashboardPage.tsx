import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { formatAed } from "@immigra/shared";
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  FileText,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Clock,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/dashboard");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNo: string) => {
    if (!window.confirm(`Are you sure you want to delete / void invoice ${invoiceNo}?`)) {
      return;
    }
    try {
      const res = await api.delete(`/invoices/${invoiceId}`);
      if (res.data.success) {
        await fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete invoice");
    }
  };

  const handleDeletePayment = async (paymentId: string, receiptNo: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete payment ${receiptNo}? Allocations and customer balance will revert.`
      )
    ) {
      return;
    }
    try {
      const res = await api.delete(`/payments/${paymentId}`);
      if (res.data.success) {
        await fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete payment");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-navy border-t-brand-gold rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading live financial dashboard...</p>
        </div>
      </div>
    );
  }

  const chartData = (data?.revenueByMonth || []).map((m: any) => ({
    name: m.month,
    Revenue: m.revenueFils / 100,
    Expense: m.expenseFils / 100,
  }));

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Executive Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business performance, invoicing status, and cash flow for Immigra Link
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/invoices/new"
            className="flex items-center gap-2 bg-brand-navy hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition border border-brand-gold/30 hover:border-brand-gold"
          >
            <PlusCircle className="w-4 h-4 text-brand-gold" />
            <span>Create Invoice</span>
          </Link>
          <Link
            to="/customers"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition border border-slate-200"
          >
            <Users className="w-4 h-4 text-brand-royal" />
            <span>Customers</span>
          </Link>
          <Link
            to="/payments"
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition border border-slate-200"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Collect Payment</span>
          </Link>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-gold/50 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoiced Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-royal flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatAed(data?.totalInvoicedFils || 0)} <span className="text-xs font-normal text-slate-500 font-sans">AED</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{data?.totalInvoicesCount || 0} Invoices Issued</span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-gold/50 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Collected Payments
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {formatAed(data?.totalCollectedFils || 0)} <span className="text-xs font-normal text-slate-500 font-sans">AED</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <span>Direct bank & cash receipts</span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Accounts Receivable
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {formatAed(data?.outstandingReceivablesFils || 0)} <span className="text-xs font-normal text-slate-500 font-sans">AED</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 font-medium">
            <span>{data?.unpaidInvoicesCount || 0} Pending & partial invoices</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-gold/50 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Profit (Revenue - Exp)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono ${data?.netProfitFils >= 0 ? "text-slate-900" : "text-red-600"}`}>
            {formatAed(data?.netProfitFils || 0)} <span className="text-xs font-normal text-slate-500 font-sans">AED</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <span>Total Expenses: {formatAed(data?.totalExpensesFils || 0)} AED</span>
          </div>
        </div>
      </div>

      {/* Secondary Bar: Available Cash & Customer metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-brand-navy to-brand-navy-light text-white rounded-xl p-5 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-brand-gold font-semibold uppercase tracking-wider mb-2">
            <span>Available Cash & Bank</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatAed(data?.availableCashFils || 0)} <span className="text-xs font-normal text-slate-300 font-sans">AED</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-2">
            Emirates NBD Main & Petty Cash in Hand
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active CRM Customers
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {data?.totalActiveCustomers || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Individual & Business accounts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Receivables
            </div>
            <div className="text-2xl font-bold text-red-600 font-mono mt-1">
              {formatAed(data?.overdueInvoicesFils || 0)} <span className="text-xs font-normal text-slate-500 font-sans">AED</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Past due payment date</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Section: Monthly Performance */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Monthly Financial Performance (AED)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of invoiced revenues versus operational expenses
            </p>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-md border border-slate-200">
            Year 2026
          </span>
        </div>

        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(val) => `${val.toLocaleString()} AED`} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} AED`]}
                  contentStyle={{
                    backgroundColor: "#06183D",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                    border: "1px solid #E8BD57",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="Revenue" fill="#06183D" name="Revenue (AED)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#E8BD57" name="Expense (AED)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No monthly financial trends recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Tables: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-navy" />
              <span>Recent Invoices</span>
            </h3>
            <Link to="/invoices" className="text-xs text-brand-royal hover:underline font-semibold">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Total (AED)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.recentInvoices || []).map((inv: any) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-semibold text-brand-royal">
                      <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 truncate max-w-[140px]">
                      {inv.customerSnapshot?.displayName}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {formatAed(inv.grandTotalFils)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          inv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.status === "PARTIALLY_PAID"
                            ? "bg-amber-100 text-amber-800"
                            : inv.status === "VOID"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {inv.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/invoices/${inv._id}`}
                          className="p-1 text-slate-500 hover:text-brand-navy hover:bg-slate-100 rounded transition"
                          title="View Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to="/invoices"
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Manage / Edit Invoice"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteInvoice(inv._id, inv.invoiceNumber)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete / Void Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Recent Payments</span>
            </h3>
            <Link to="/payments" className="text-xs text-brand-royal hover:underline font-semibold">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount (AED)</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.recentPayments || []).map((pay: any) => (
                  <tr key={pay._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                      {pay.receiptNumber}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 truncate max-w-[140px]">
                      {pay.customerName || "Customer"}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                      +{formatAed(pay.amountFils)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">
                      {pay.paymentMethod}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to="/payments"
                          className="p-1 text-slate-500 hover:text-brand-navy hover:bg-slate-100 rounded transition"
                          title="View / Manage Payments"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to="/payments"
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit Payment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeletePayment(pay._id, pay.receiptNumber)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
