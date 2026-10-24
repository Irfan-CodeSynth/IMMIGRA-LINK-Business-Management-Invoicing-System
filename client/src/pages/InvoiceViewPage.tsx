import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { InvoiceTemplate } from "../components/invoice/InvoiceTemplate";
import { IInvoice, formatAed, PaymentMethod } from "@immigra/shared";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Printer,
  Download,
  CreditCard,
  Ban,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
} from "lucide-react";
import { DeleteConfirmModal } from "../components/common/DeleteConfirmModal";
import { showAppAlert } from "../services/alertService";

export const InvoiceViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmountAed, setPaymentAmountAed] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [depositAccountCode, setDepositAccountCode] = useState<string>("1010");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const invoiceResponse = await api.get(`/invoices/${id}`);
      const settingsResponse = await api.get(`/settings`);
      if (invoiceResponse.data.success) {
        setInvoice(invoiceResponse.data.data);
        setPaymentAmountAed(invoiceResponse.data.data.dueAmountFils / 100);
      }
      if (settingsResponse.data.success) {
        setSettings(settingsResponse.data.data);
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById("invoice-printable");
    if (!element || !invoice) return;

    setPdfGenerating(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNumber.replace(/\//g, "-")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!invoice) return;
    setIsVoiding(true);
    try {
      const res = await api.patch(`/invoices/${invoice._id}/void`);
      if (res.data.success) {
        setInvoice(res.data.data);
        setShowVoidModal(false);
      }
    } catch (err: any) {
      setShowVoidModal(false);
      showAppAlert(err.response?.data?.message || "Failed to void invoice", "Void Failed", "error");
    } finally {
      setIsVoiding(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setPaymentSubmitting(true);

    try {
      const res = await api.post("/payments", {
        customerId: invoice.customerId,
        paymentDate: new Date().toISOString(),
        amountAed: Number(paymentAmountAed),
        paymentMethod,
        depositAccountCode,
        notes: paymentNotes,
        allocations: [
          {
            invoiceId: invoice._id,
            allocatedAmountAed: Number(paymentAmountAed),
          },
        ],
      });

      if (res.data.success) {
        setShowPaymentModal(false);
        await fetchData(); // refresh invoice state
      }
    } catch (err: any) {
      showAppAlert(err.response?.data?.message || "Failed to record payment", "Payment Error", "error");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-navy border-t-brand-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Invoice Not Found</h2>
        <Link to="/invoices" className="text-xs text-brand-royal mt-2 inline-block font-semibold">
          Return to Invoices List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                  invoice.status === "PAID"
                    ? "bg-emerald-100 text-emerald-800"
                    : invoice.status === "PARTIALLY_PAID"
                    ? "bg-amber-100 text-amber-800"
                    : invoice.status === "VOID"
                    ? "bg-slate-100 text-slate-600 line-through"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {invoice.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Due: {formatAed(invoice.dueAmountFils)} AED • Customer: {invoice.customerSnapshot.displayName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Invoice Button */}
          <Link
            to={`/invoices/${invoice._id}/edit`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Invoice</span>
          </Link>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Invoice</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {pdfGenerating ? (
              <span className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Download className="w-4 h-4 text-slate-600" />
            )}
            <span>Download A4 PDF</span>
          </button>

          {/* Record Payment Button (only if balance due) */}
          {invoice.dueAmountFils > 0 && invoice.status !== "VOID" && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}

          {/* Void Button */}
          {invoice.status !== "VOID" && invoice.paidAmountFils === 0 && (
            <button
              onClick={() => setShowVoidModal(true)}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-semibold transition border border-transparent hover:border-red-200"
            >
              <Ban className="w-4 h-4" />
              <span>Void</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Official Invoice Component */}
      <div className="py-2">
        <InvoiceTemplate invoice={invoice} companySettings={settings} />
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-gold" />
                <h3 className="text-sm font-bold">Record Payment for {invoice.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outstanding Due Amount
                </label>
                <div className="text-base font-bold text-red-600 font-mono bg-red-50 p-2 rounded border border-red-200">
                  {formatAed(invoice.dueAmountFils)} AED
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount (AED)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={invoice.dueAmountFils / 100}
                  required
                  value={paymentAmountAed}
                  onChange={(e) => setPaymentAmountAed(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-gold/50"
                  >
                    <option value={PaymentMethod.CASH}>Cash in Hand</option>
                    <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                    <option value={PaymentMethod.CARD}>Card</option>
                    <option value={PaymentMethod.CHEQUE}>Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deposit Account
                  </label>
                  <select
                    value={depositAccountCode}
                    onChange={(e) => setDepositAccountCode(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-gold/50"
                  >
                    <option value="1010">1010 - Cash in Hand</option>
                    <option value="1020">1020 - Emirates NBD Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Notes / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Counter cash receipt or bank ref #"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {paymentSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Post Payment & Issue Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Invoice Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showVoidModal}
        title="Void Tax Invoice"
        itemName={invoice.invoiceNumber}
        message="Are you sure you want to void this invoice? This action is irreversible and cancels accounting balances."
        warningNote="Once voided, payments can no longer be recorded against this invoice."
        confirmText="Yes, Void Invoice"
        isDeleting={isVoiding}
        onConfirm={handleConfirmVoid}
        onClose={() => setShowVoidModal(false)}
      />
    </div>
  );
};
