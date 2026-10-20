import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { formatAed, IExpense, PaymentMethod } from "@immigra/shared";
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  X,
  CreditCard,
  Building,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "../components/common/DeleteConfirmModal";
import { showAppAlert } from "../services/alertService";

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState("Government Transaction & Tasheel Fees");
  const [payee, setPayee] = useState("");
  const [expenseAccountCode, setExpenseAccountCode] = useState("5010");
  const [paymentAccountCode, setPaymentAccountCode] = useState("1010");
  const [amountAed, setAmountAed] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // View Modal
  const [viewingExpense, setViewingExpense] = useState<IExpense | null>(null);

  // Edit Modal
  const [editingExpense, setEditingExpense] = useState<IExpense | null>(null);
  const [editPayee, setEditPayee] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editMethod, setEditMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [editReference, setEditReference] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Delete Confirmation Modal
  const [deletingExpense, setDeletingExpense] = useState<IExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = [
    { label: "Government Fees & Tasheel", account: "5010" },
    { label: "Office Rent", account: "5020" },
    { label: "Staff Salaries & Allowances", account: "5030" },
    { label: "Utilities (DEWA & Internet)", account: "5040" },
    { label: "Marketing, Ads & Software", account: "5050" },
    { label: "Office Supplies & Miscellaneous", account: "5060" },
    { label: "Supplier Services Cost", account: "5070" },
  ];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = "/expenses?";
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setExpenses(res.data.data.expenses);
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleCategorySelect = (selectedCat: string) => {
    setCategory(selectedCat);
    const found = categories.find((c) => c.label === selectedCat);
    if (found) {
      setExpenseAccountCode(found.account);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payee.trim()) {
      showAppAlert("Please enter the payee or supplier name", "Validation Error", "warning");
      return;
    }
    if (amountAed <= 0) {
      showAppAlert("Expense amount must be greater than zero AED", "Validation Error", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/expenses", {
        expenseDate,
        category,
        payee,
        expenseAccountCode,
        paymentAccountCode,
        amountAed: Number(amountAed),
        paymentMethod,
        referenceNumber,
        notes,
      });

      if (res.data.success) {
        setShowModal(false);
        setPayee("");
        setNotes("");
        setReferenceNumber("");
        await fetchExpenses();
      }
    } catch (err: any) {
      showAppAlert(err.response?.data?.message || "Failed to record expense", "Expense Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (exp: IExpense) => {
    setEditingExpense(exp);
    setEditPayee(exp.payee);
    setEditCategory(exp.category);
    setEditMethod(exp.paymentMethod);
    setEditReference(exp.referenceNumber || "");
    setEditNotes(exp.notes || "");
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    try {
      const res = await api.put(`/expenses/${editingExpense._id}`, {
        payee: editPayee,
        category: editCategory,
        paymentMethod: editMethod,
        referenceNumber: editReference,
        notes: editNotes,
      });
      if (res.data.success) {
        setEditingExpense(null);
        await fetchExpenses();
      }
    } catch (err: any) {
      showAppAlert(err.response?.data?.message || "Failed to update expense", "Update Error", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    try {
      await api.delete(`/expenses/${deletingExpense._id}`);
      setDeletingExpense(null);
      await fetchExpenses();
    } catch (err: any) {
      setDeletingExpense(null);
      showAppAlert(err.response?.data?.message || "Failed to delete expense", "Action Blocked", "error");
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
            Expense & Cost Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record operating expenses, Tasheel government fees, office overhead, and supplier disbursements
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-navy hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition border border-brand-gold/40 hover:border-brand-gold"
        >
          <PlusCircle className="w-4 h-4 text-brand-gold" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setCategoryFilter("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              categoryFilter === ""
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Categories
          </button>
          {categories.slice(0, 3).map((cat) => (
            <button
              key={cat.label}
              onClick={() => setCategoryFilter(cat.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                categoryFilter === cat.label
                  ? "bg-brand-navy text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payee, expense #, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
        </form>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Expense #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payee / Vendor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Account</th>
                <th className="py-3 px-4 text-right">Amount (AED)</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-navy border-t-brand-gold rounded-full animate-spin mx-auto mb-2"></div>
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No expenses logged. Click "Record New Expense" to add one.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(exp.expenseDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {exp.payee}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {exp.paymentAccountCode === "1010" ? "Cash (1010)" : "Bank (1020)"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatAed(exp.amountFils)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {exp.notes || "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingExpense(exp)}
                          className="p-1.5 text-slate-500 hover:text-brand-navy hover:bg-slate-100 rounded transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete Expense"
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

      {/* Record Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 text-xs">
            <div className="p-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-gold" />
                <span>Record Operational Expense</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount (AED) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amountAed}
                    onChange={(e) => setAmountAed(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono font-bold border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payee / Vendor / Government Entity *
                </label>
                <input
                  type="text"
                  required
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="e.g. Tasheel Centre / Landlord / DEWA"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50"
                >
                  {categories.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label} ({c.account})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Paid From Account *
                  </label>
                  <select
                    value={paymentAccountCode}
                    onChange={(e) => setPaymentAccountCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="1010">1010 - Cash in Hand</option>
                    <option value="1020">1020 - Emirates NBD Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value={PaymentMethod.CASH}>Cash</option>
                    <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                    <option value={PaymentMethod.CARD}>Corporate Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference # / Voucher Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Receipt # or invoice ref"
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
                  className="px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm"
                >
                  {submitting ? "Posting..." : "Post Expense to Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Expense Details</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Voucher #{viewingExpense.expenseNumber}
                </p>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 mb-4 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Expense Date:</span>
                <span className="font-semibold text-slate-900">
                  {new Date(viewingExpense.expenseDate).toLocaleDateString("en-GB")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Payee / Vendor:</span>
                <span className="font-bold text-slate-900">{viewingExpense.payee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Category:</span>
                <span className="text-slate-700">{viewingExpense.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Paid From:</span>
                <span className="text-slate-700">
                  {viewingExpense.paymentAccountCode === "1010" ? "Cash (1010)" : "Bank (1020)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Payment Method:</span>
                <span className="text-slate-700">{viewingExpense.paymentMethod}</span>
              </div>
              {viewingExpense.referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Reference / Ref #:</span>
                  <span className="text-slate-700">{viewingExpense.referenceNumber}</span>
                </div>
              )}
              {viewingExpense.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-sans block mb-1">Notes:</span>
                  <p className="font-sans text-slate-700 whitespace-pre-wrap">
                    {viewingExpense.notes}
                  </p>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="text-slate-900 font-sans font-bold">Total Disbursed:</span>
                <span className="font-bold text-rose-600">
                  {formatAed(viewingExpense.amountFils)} AED
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  const exp = viewingExpense;
                  setViewingExpense(null);
                  handleOpenEdit(exp);
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={() => setViewingExpense(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 text-xs">
            <div className="p-4 bg-brand-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-gold" />
                <span>Edit Expense ({editingExpense.expenseNumber})</span>
              </h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="p-6 space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount (AED)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${formatAed(editingExpense.amountFils)} AED`}
                  className="w-full border border-slate-200 bg-slate-100 font-mono font-bold rounded-lg p-2 text-slate-700 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Amount cannot be changed to prevent journal balance mismatch. Delete and re-create if needed.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payee / Vendor / Government Entity *
                </label>
                <input
                  type="text"
                  required
                  value={editPayee}
                  onChange={(e) => setEditPayee(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 focus:ring-2 focus:ring-brand-gold focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-gold focus:outline-none"
                >
                  <option value={PaymentMethod.CASH}>Cash</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                  <option value={PaymentMethod.CARD}>Corporate Card</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference # / Voucher Note
                </label>
                <input
                  type="text"
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  placeholder="e.g. Receipt # or invoice ref"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-gold focus:outline-none"
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
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-gold focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm"
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
        isOpen={!!deletingExpense}
        title="Delete Expense Voucher"
        itemName={deletingExpense ? `${deletingExpense.expenseNumber} — ${deletingExpense.payee} (${formatAed(deletingExpense.amountFils)} AED)` : ""}
        message="Are you sure you want to delete this expense record? The general ledger line entries for this disbursement will be removed."
        warningNote="This action permanently removes this expense transaction from your financial reporting."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingExpense(null)}
      />
    </div>
  );
};
