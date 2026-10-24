import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { formatAed, IQuotation, QuotationStatus } from "@immigra/shared";
import {
  FileSpreadsheet,
  PlusCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { DeleteConfirmModal } from "../components/common/DeleteConfirmModal";
import { showAppAlert } from "../services/alertService";

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [viewingQuotation, setViewingQuotation] = useState<IQuotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<IQuotation | null>(null);
  const [editStatus, setEditStatus] = useState<string>("DRAFT");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [deletingQuotation, setDeletingQuotation] = useState<IQuotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/quotations");
      if (res.data.success) {
        setQuotations(res.data.data.quotations);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  const [convertingQuotation, setConvertingQuotation] = useState<IQuotation | null>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleConvert = async (quotationId: string) => {
    setConvertingId(quotationId);
    try {
      const res = await api.post(`/quotations/${quotationId}/convert`);
      if (res.data.success) {
        setConvertingQuotation(null);
        window.location.href = `/invoices/${res.data.data.invoice._id}`;
      }
    } catch (err: any) {
      setConvertingQuotation(null);
      showAppAlert(err.response?.data?.message || "Failed to convert quotation", "Conversion Error", "error");
    } finally {
      setConvertingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuotation) return;
    setIsDeleting(true);
    try {
      await api.delete(`/quotations/${deletingQuotation._id}`);
      setDeletingQuotation(null);
      await fetchQuotations();
    } catch (err: any) {
      setDeletingQuotation(null);
      showAppAlert(err.response?.data?.message || "Failed to delete quotation", "Action Blocked", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditQuotation = (q: IQuotation) => {
    setEditingQuotation(q);
    setEditStatus(q.status);
    setEditNotes(q.notes || "");
  };

  const handleSaveEditQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotation) return;
    setEditSaving(true);
    try {
      await api.put(`/quotations/${editingQuotation._id}`, {
        status: editStatus,
        notes: editNotes,
      });
      setEditingQuotation(null);
      await fetchQuotations();
    } catch (err: any) {
      showAppAlert(err.response?.data?.message || "Failed to update quotation", "Update Error", "error");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quotation Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prepare, approve, and convert client quotations into commercial invoices
          </p>
        </div>

        <Link
          to="/quotations/new"
          className="flex items-center gap-2 bg-brand-navy hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition border border-brand-gold/40 hover:border-brand-gold"
        >
          <PlusCircle className="w-4 h-4 text-brand-gold" />
          <span>Create New Quotation</span>
        </Link>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Total (AED)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-navy border-t-brand-gold rounded-full animate-spin mx-auto mb-2"></div>
                    Loading quotations...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No quotations generated yet. Click "+ Create New Quotation" to start.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {q.quotationNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {q.customerSnapshot?.displayName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(q.issueDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(q.expiryDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatAed(q.grandTotalFils)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          q.status === "CONVERTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : q.status === "APPROVED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => setViewingQuotation(q)}
                          title="View Quotation Breakdown"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>View</span>
                        </button>
                        <Link
                          to={`/quotations/${q._id}/edit`}
                          title="Edit Full Quotation"
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => setDeletingQuotation(q)}
                          title="Delete Quotation"
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex items-center gap-1 font-semibold text-[11px] transition shadow-xs"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                        {q.status !== "CONVERTED" ? (
                          <button
                            onClick={() => setConvertingQuotation(q)}
                            disabled={convertingId === q._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-50 border border-brand-gold/60 text-brand-navy hover:bg-brand-gold transition shadow-xs"
                          >
                            <span>Convert</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <Link
                            to={`/invoices/${q.convertedInvoiceId}`}
                            className="text-[11px] font-bold text-brand-royal hover:underline px-2 py-1 bg-emerald-50 rounded border border-emerald-200"
                          >
                            Invoice &rarr;
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Quotation Modal */}
      {viewingQuotation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-brand-gold" />
                <span>Quotation: {viewingQuotation.quotationNumber}</span>
              </h3>
              <button
                onClick={() => setViewingQuotation(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Customer</span>
                <div className="font-bold text-slate-900 text-sm">{viewingQuotation.customerSnapshot?.displayName}</div>
                {viewingQuotation.customerSnapshot?.phone && (
                  <div className="text-slate-600 font-mono">Mob: {viewingQuotation.customerSnapshot.phone}</div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Line Items</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Service</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Total (AED)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingQuotation.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-900">{item.serviceName}</div>
                            {item.description && <div className="text-[10px] text-slate-500">{item.description}</div>}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">{item.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatAed(item.lineTotalFils)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg text-white font-mono">
                <span className="text-slate-300 font-sans text-xs">Total Estimate:</span>
                <span className="text-base font-bold text-brand-gold">
                  {formatAed(viewingQuotation.grandTotalFils)} AED
                </span>
              </div>

              {viewingQuotation.notes && (
                <div>
                  <span className="text-slate-500 font-medium block mb-1">Notes:</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                    {viewingQuotation.notes}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                {viewingQuotation.status !== "CONVERTED" && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingQuotation._id;
                      setViewingQuotation(null);
                      handleConvert(id);
                    }}
                    className="px-4 py-2 bg-brand-gold hover:bg-yellow-500 text-slate-950 font-bold rounded-lg shadow-sm"
                  >
                    Convert to Invoice
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingQuotation(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quotation Modal */}
      {editingQuotation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-gold" />
                <span>Edit Quotation: {editingQuotation.quotationNumber}</span>
              </h3>
              <button
                onClick={() => setEditingQuotation(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuotation} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terms / Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuotation(null)}
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
        isOpen={!!deletingQuotation}
        title="Delete Quotation"
        itemName={deletingQuotation ? `${deletingQuotation.quotationNumber} — ${deletingQuotation.customerSnapshot?.displayName}` : ""}
        message="Are you sure you want to delete this quotation estimate? This action cannot be undone."
        warningNote={deletingQuotation?.status === "CONVERTED" ? "This quotation was already converted into an active invoice." : undefined}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingQuotation(null)}
      />

      {/* Convert Quotation Modal */}
      {convertingQuotation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Convert Quotation to Invoice</h3>
              <p className="text-xs text-slate-600 mb-4">
                Are you sure you want to convert quotation{" "}
                <span className="font-mono font-bold text-brand-navy">{convertingQuotation.quotationNumber}</span> into an official issued Tax Invoice?
              </p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mb-5 text-xs text-slate-600">
                <div className="font-semibold text-slate-800">{convertingQuotation.customerSnapshot?.displayName}</div>
                <div className="font-mono text-emerald-700 font-bold mt-1">
                  Total: {formatAed(convertingQuotation.grandTotalFils)} AED
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConvertingQuotation(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={convertingId === convertingQuotation._id}
                  onClick={() => handleConvert(convertingQuotation._id)}
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-navy hover:bg-slate-900 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  {convertingId === convertingQuotation._id ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>Yes, Convert to Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
