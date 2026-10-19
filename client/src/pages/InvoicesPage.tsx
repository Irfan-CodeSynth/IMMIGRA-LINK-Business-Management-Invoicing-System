import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { formatAed, IInvoice } from "@immigra/shared";
import {
  PlusCircle,
  Search,
  FileText,
  Printer,
  ChevronRight,
  Filter,
} from "lucide-react";

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = "/invoices?";
      if (statusFilter) url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setInvoices(res.data.data.invoices);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Invoice Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, issue, track, and print official UAE invoices
          </p>
        </div>

        <Link
          to="/invoices/new"
          className="flex items-center gap-2 bg-brand-navy hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition border border-brand-gold/40 hover:border-brand-gold"
        >
          <PlusCircle className="w-4 h-4 text-brand-gold" />
          <span>Create New Invoice</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { label: "All Invoices", val: "" },
            { label: "Issued", val: "ISSUED" },
            { label: "Partially Paid", val: "PARTIALLY_PAID" },
            { label: "Paid", val: "PAID" },
            { label: "Overdue", val: "OVERDUE" },
            { label: "Void", val: "VOID" },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab.val
                  ? "bg-brand-navy text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Grand Total (AED)</th>
                <th className="py-3 px-4 text-right">Paid (AED)</th>
                <th className="py-3 px-4 text-right">Due (AED)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-navy border-t-brand-gold rounded-full animate-spin mx-auto mb-2"></div>
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-brand-navy">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="hover:text-brand-royal hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{inv.customerSnapshot?.displayName}</div>
                      {inv.customerSnapshot?.companyName && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {inv.customerSnapshot.companyName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.issueDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatAed(inv.grandTotalFils)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                      {formatAed(inv.paidAmountFils)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                      {formatAed(inv.dueAmountFils)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          inv.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.status === "PARTIALLY_PAID"
                            ? "bg-amber-100 text-amber-800"
                            : inv.status === "VOID"
                            ? "bg-slate-100 text-slate-600 line-through"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {inv.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-royal hover:text-brand-navy px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
