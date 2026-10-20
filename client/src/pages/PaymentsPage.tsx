import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { formatAed, IPayment, ICustomer, IInvoice, PaymentMethod } from "@immigra/shared";
import immigraLogo from "../assets/immigra-logo.jpg";
import {
  CreditCard,
  PlusCircle,
  Receipt,
  Printer,
  X,
  Search,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "../components/common/DeleteConfirmModal";
import { showAppAlert } from "../services/alertService";

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerInvoices, setCustomerInvoices] = useState<IInvoice[]>([]);
  const [paymentAmountAed, setPaymentAmountAed] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [depositAccountCode, setDepositAccountCode] = useState<string>("1010");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // View Receipt Modal
  const [viewingPayment, setViewingPayment] = useState<IPayment | null>(null);

  // Edit Payment Modal
  const [editingPayment, setEditingPayment] = useState<IPayment | null>(null);
  const [editMethod, setEditMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [editReference, setEditReference] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Delete Confirmation Modal
  const [deletingPayment, setDeletingPayment] = useState<IPayment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/payments");
      if (res.data.success) {
        setPayments(res.data.data.payments);
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    api.get("/customers?limit=100").then((res) => {
      if (res.data.success) {
        setCustomers(res.data.data.customers);
      }
    });
  }, []);

  const handleCustomerChange = async (cId: string) => {
    setSelectedCustomerId(cId);
    setSelectedInvoiceId("");
    if (!cId) {
      setCustomerInvoices([]);
      return;
    }

    try {
      const res = await api.get(`/customers/${cId}`);
      if (res.data.success) {
        const unpaid = (res.data.data.invoices || []).filter(
          (inv: IInvoice) => inv.dueAmountFils > 0 && inv.status !== "VOID"
        );
        setCustomerInvoices(unpaid);
        if (unpaid.length > 0) {
          setSelectedInvoiceId(unpaid[0]._id);
          setPaymentAmountAed(unpaid[0].dueAmountFils / 100);
        } else {
          setPaymentAmountAed(0);
        }
      }
    } catch (err) {
      console.error("Error fetching customer invoices:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showAppAlert("Please select a customer to record payment", "Validation Error", "warning");
      return;
    }
    if (paymentAmountAed <= 0) {
      showAppAlert("Payment amount must be greater than zero AED", "Validation Error", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const allocations = selectedInvoiceId
        ? [
            {
              invoiceId: selectedInvoiceId,
              allocatedAmountAed: Number(paymentAmountAed),
            },
          ]
        : [];

      const res = await api.post("/payments", {
        customerId: selectedCustomerId,
        paymentDate: new Date().toISOString(),
        amountAed: Number(paymentAmountAed),
        paymentMethod,
        depositAccountCode,
        referenceNumber,
        allocations,
        notes,
      });

      if (res.data.success) {
        setShowModal(false);
        await fetchPayments();
        setViewingPayment(res.data.data);
      }
    } catch (err: any) {
      showAppAlert(err.response?.data?.message || "Failed to record payment", "Payment Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (p: IPayment) => {
    setEditingPayment(p);
    setEditMethod(p.paymentMethod);
    setEditReference(p.referenceNumber || "");
    setEditNotes(p.notes || "");
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    try {
      const res = await api.put(`/payments/${editingPayment._id}`, {
        paymentMethod: editMethod,
        referenceNumber: editReference,
        notes: editNotes,
      });
      if (res.data.success) {
        setEditingPayment(null);
        await fetchPayments();
      }
    } catch (err: any) {
      showAppAlert(err.response?.data?.message || "Failed to update payment", "Update Error", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPayment) return;
    setIsDeleting(true);
    try {
      await api.delete(`/payments/${deletingPayment._id}`);
      setDeletingPayment(null);
      await fetchPayments();
    } catch (err: any) {
      setDeletingPayment(null);
      showAppAlert(err.response?.data?.message || "Failed to delete payment", "Action Blocked", "error");
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
            Payments & Collections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record customer cash & bank receipts, allocate against invoices, and issue vouchers
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            if (customers.length > 0) {
              handleCustomerChange(customers[0]._id);
            }
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Deposit Account</th>
                <th className="py-3 px-4 text-right">Amount (AED)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-navy border-t-brand-gold rounded-full animate-spin mx-auto mb-2"></div>
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No payments recorded yet. Click "Record New Payment" to log one.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.customerName || "Customer"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.depositAccountCode === "1010" ? "1010 - Cash in Hand" : "1020 - Emirates NBD"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                      +{formatAed(p.amountFils)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingPayment(p)}
                          className="p-1.5 text-slate-500 hover:text-brand-navy hover:bg-slate-100 rounded transition"
                          title="View Receipt Voucher"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit Payment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingPayment(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 text-xs">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Record Customer Payment</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                >
                  <option value="">— Select Customer —</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.displayName} (Balance: {formatAed(c.balanceFils)} AED)
                    </option>
                  ))}
                </select>
              </div>

              {customerInvoices.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Allocate to Invoice (Optional)
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => {
                      setSelectedInvoiceId(e.target.value);
                      const inv = customerInvoices.find((i) => i._id === e.target.value);
                      if (inv) setPaymentAmountAed(inv.dueAmountFils / 100);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-mono text-[11px]"
                  >
                    <option value="">— Customer Advance Deposit (Unallocated) —</option>
                    {customerInvoices.map((inv) => (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceNumber} — Due: {formatAed(inv.dueAmountFils)} AED
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Received Amount (AED) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmountAed}
                  onChange={(e) => setPaymentAmountAed(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono font-bold text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value={PaymentMethod.CASH}>Cash in Hand</option>
                    <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                    <option value={PaymentMethod.CARD}>Card</option>
                    <option value={PaymentMethod.CHEQUE}>Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deposit Account *
                  </label>
                  <select
                    value={depositAccountCode}
                    onChange={(e) => setDepositAccountCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="1010">1010 - Cash in Hand</option>
                    <option value="1020">1020 - Emirates NBD Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference / Transaction #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank slip or auth code"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? "Posting..." : "Post Payment & Generate Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Voucher Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <img src={immigraLogo} alt="Logo" className="w-12 h-12 rounded object-cover border" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    IMMIGRA LINK BUSINESS SERVICES
                  </h3>
                  <p className="text-[10px] text-brand-gold font-semibold uppercase">
                    Official Payment Receipt Voucher
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 mb-4 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Receipt Voucher #:</span>
                <span className="font-bold text-slate-900">{viewingPayment.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Date Received:</span>
                <span>{new Date(viewingPayment.paymentDate).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Received From:</span>
                <span className="font-bold text-brand-navy">{viewingPayment.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Payment Method:</span>
                <span>{viewingPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="text-slate-900 font-sans font-bold">Total Amount Received:</span>
                <span className="font-bold text-emerald-700">
                  {formatAed(viewingPayment.amountFils)} AED
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setViewingPayment(null)}
                className="px-4 py-2 bg-brand-navy text-white rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 text-xs">
            <div className="p-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-gold" />
                <span>Edit Payment Details ({editingPayment.receiptNumber})</span>
              </h3>
              <button
                onClick={() => setEditingPayment(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  disabled
                  value={editingPayment.customerName || "Customer"}
                  className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2.5 text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Received (AED)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${formatAed(editingPayment.amountFils)} AED`}
                  className="w-full border border-slate-200 bg-slate-100 font-mono font-bold rounded-lg p-2.5 text-slate-700 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Amount cannot be edited directly to preserve ledger integrity. To adjust amounts, delete and re-enter.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-brand-gold focus:outline-none"
                >
                  <option value={PaymentMethod.CASH}>Cash in Hand</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                  <option value={PaymentMethod.CARD}>Card</option>
                  <option value={PaymentMethod.CHEQUE}>Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference / Transaction #
                </label>
                <input
                  type="text"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  placeholder="e.g. Bank slip or auth code"
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Internal notes..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-gold focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-navy hover:bg-brand-navy/90 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingPayment}
        title="Delete Payment Receipt Voucher"
        itemName={deletingPayment ? `${deletingPayment.receiptNumber} (${formatAed(deletingPayment.amountFils)} AED)` : ""}
        message="Are you sure you want to delete this payment receipt? The invoice allocations will be removed, customer outstanding balance will be restored, and double-entry ledger entries will be reversed."
        warningNote="This will decrease collected cash/bank balances in your general ledger."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingPayment(null)}
      />
    </div>
  );
};
