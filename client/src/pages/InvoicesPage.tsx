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
  Eye,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { DeleteConfirmModal } from "../components/common/DeleteConfirmModal";

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [editingInvoice, setEditingInvoice] = useState<IInvoice | null>(null);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editPaymentTerms, setEditPaymentTerms] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [deletingInvoice, setDeletingInvoice] = useState<IInvoice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const openEditInvoice = (inv: IInvoice) => {
    setEditingInvoice(inv);
    setEditNotes(inv.notes || "");
    setEditPaymentTerms(inv.paymentTerms || "");
    setEditDueDate(new Date(inv.dueDate).toISOString().split("T")[0]);
  };

  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setEditSaving(true);
    try {
      await api.put(`/invoices/${editingInvoice._id}`, {
        notes: editNotes,
        paymentTerms: editPaymentTerms,
        dueDate: editDueDate,
      });
      setEditingInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update invoice");
    } finally {
      setEditSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return;
    setIsDeleting(true);
    try {
      await api.delete(`/invoices/${deletingInvoice._id}`);
      setDeletingInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete invoice");
    } finally {
      setIsDeleting(false);
    }
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
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Link
                          to={`/invoices/${inv._id}`}
                          title="View Official Invoice / PDF"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </Link>
                        <button
                          onClick={() => openEditInvoice(inv)}
                          title="Edit Invoice Terms / Notes"
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingInvoice(inv)}
                          title="Delete / Void Invoice"
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-gold" />
                <span>Edit Invoice: {editingInvoice.invoiceNumber}</span>
              </h3>
              <button
                onClick={() => setEditingInvoice(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={editPaymentTerms}
                  onChange={(e) => setEditPaymentTerms(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingInvoice}
        title="Void / Delete Invoice"
        itemName={deletingInvoice ? `${deletingInvoice.invoiceNumber} — ${deletingInvoice.customerSnapshot?.displayName}` : ""}
        message="Are you sure you want to void or delete this invoice? The invoice status will be marked VOID, customer due balance will be reverted, and accounting journal entries will be reversed."
        warningNote={deletingInvoice && deletingInvoice.paidAmountFils > 0 ? `Notice: This invoice has AED ${formatAed(deletingInvoice.paidAmountFils)} in collected payments. Please ensure associated payment receipts are adjusted accordingly.` : undefined}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingInvoice(null)}
      />
    </div>
  );
};
