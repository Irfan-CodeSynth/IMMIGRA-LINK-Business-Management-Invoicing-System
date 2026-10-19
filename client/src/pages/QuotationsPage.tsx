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
} from "lucide-react";

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<IQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleConvert = async (quotationId: string) => {
    if (!window.confirm("Convert this quotation into an official issued invoice?")) {
      return;
    }

    setConvertingId(quotationId);
    try {
      const res = await api.post(`/quotations/${quotationId}/convert`);
      if (res.data.success) {
        window.location.href = `/invoices/${res.data.data.invoice._id}`;
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to convert quotation");
    } finally {
      setConvertingId(null);
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
                    <td className="py-3 px-4 text-right space-x-2">
                      {q.status !== "CONVERTED" ? (
                        <button
                          onClick={() => handleConvert(q._id)}
                          disabled={convertingId === q._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-amber-50 border border-brand-gold/60 text-brand-navy hover:bg-brand-gold transition shadow-sm"
                        >
                          {convertingId === q._id ? (
                            <span>Converting...</span>
                          ) : (
                            <>
                              <span>Convert to Invoice</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          to={`/invoices/${q.convertedInvoiceId}`}
                          className="text-xs font-semibold text-brand-royal hover:underline"
                        >
                          View Invoice
                        </Link>
                      )}
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
