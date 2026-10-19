import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { formatAed, numberToAedWords, ICustomer, IService } from "@immigra/shared";
import {
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  UserPlus,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface FormItem {
  serviceId?: string;
  serviceName: string;
  description: string;
  quantity: number;
  unitRateAed: number;
  discountAed: number;
  lineTotalAed: number;
}

export const InvoiceBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>("INV-001");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [customerId, setCustomerId] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [supplyDate, setSupplyDate] = useState<string>("");
  const [referenceNote, setReferenceNote] = useState<string>("");
  const [notes, setNotes] = useState<string>(
    "Thank you for choosing Immigra Link Business Services. For inquiries, contact info@immigralink.ae."
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    "Please make payment via Bank Transfer to Emirates NBD or Cash at our office counter."
  );

  const [items, setItems] = useState<FormItem[]>([
    {
      serviceName: "Inside Entry Permit",
      description: "Visa applicant document processing",
      quantity: 1,
      unitRateAed: 1160,
      discountAed: 0,
      lineTotalAed: 1160,
    },
  ]);

  // Quick Customer Creation modal
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustType, setNewCustType] = useState<"INDIVIDUAL" | "BUSINESS">("BUSINESS");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, srvRes, nextNumRes] = await Promise.all([
          api.get("/customers?limit=100"),
          api.get("/services?activeOnly=true"),
          api.get("/invoices/next-number").catch(() => null),
        ]);
        if (custRes.data.success) {
          setCustomers(custRes.data.data.customers);
          if (custRes.data.data.customers.length > 0) {
            setCustomerId(custRes.data.data.customers[0]._id);
          }
        }
        if (srvRes.data.success) {
          setServices(srvRes.data.data);
        }
        if (nextNumRes?.data?.success && nextNumRes.data.data?.nextInvoiceNumber) {
          setNextInvoiceNumber(nextNumRes.data.data.nextInvoiceNumber);
        }
      } catch (err) {
        console.error("Error loading builder data:", err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchData();
  }, []);

  const handleServiceSelect = (index: number, serviceId: string) => {
    const srv = services.find((s) => s._id === serviceId);
    if (!srv) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        serviceId: srv._id,
        serviceName: srv.name,
        description: srv.description || srv.category,
        unitRateAed: srv.defaultRateFils / 100,
        lineTotalAed:
          copy[index].quantity * (srv.defaultRateFils / 100) -
          copy[index].discountAed,
      };
      return copy;
    });
  };

  const handleItemChange = (index: number, field: keyof FormItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: val };

      const qty = item.quantity || 0;
      const rate = item.unitRateAed || 0;
      const disc = item.discountAed || 0;
      item.lineTotalAed = Math.max(0, qty * rate - disc);

      copy[index] = item;
      return copy;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        serviceName: "",
        description: "",
        quantity: 1,
        unitRateAed: 0,
        discountAed: 0,
        lineTotalAed: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let discounts = 0;
    items.forEach((it) => {
      subtotal += (it.quantity || 0) * (it.unitRateAed || 0);
      discounts += it.discountAed || 0;
    });
    const grandTotal = Math.max(0, subtotal - discounts);
    return {
      subtotal,
      discounts,
      grandTotal,
      words: numberToAedWords(grandTotal, false),
    };
  };

  const totals = calculateTotals();

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/customers", {
        customerType: newCustType,
        displayName: newCustName,
        companyName: newCustType === "BUSINESS" ? newCustName : undefined,
        phone: newCustPhone,
      });
      if (res.data.success) {
        setCustomers((prev) => [res.data.data, ...prev]);
        setCustomerId(res.data.data._id);
        setShowQuickCustomerModal(false);
        setNewCustName("");
        setNewCustPhone("");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add customer");
    }
  };

  const handleSubmit = async (status: "DRAFT" | "ISSUED") => {
    if (!customerId) {
      alert("Please select a customer");
      return;
    }
    if (items.some((i) => !i.serviceName.trim())) {
      alert("All service rows must have a service name");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId,
        issueDate,
        dueDate,
        supplyDate: supplyDate || undefined,
        referenceNote,
        items: items.map((i) => ({
          serviceId: i.serviceId,
          serviceName: i.serviceName,
          description: i.description,
          quantity: Number(i.quantity),
          unitRateAed: Number(i.unitRateAed),
          discountAed: Number(i.discountAed || 0),
        })),
        notes,
        paymentTerms,
        status,
      };

      const res = await api.post("/invoices", payload);
      if (res.data.success) {
        navigate(`/invoices/${res.data.data._id}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-navy border-t-brand-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/invoices"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Create New Invoice
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-brand-gold border border-brand-gold/40 shadow-sm">
                Invoice ID: {nextInvoiceNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Build a professional UAE commercial invoice for Immigra Link (Strict sequential numbering)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit("DRAFT")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit("ISSUED")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-brand-navy hover:bg-slate-900 text-white shadow-md transition border border-brand-gold/40 hover:border-brand-gold disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Send className="w-4 h-4 text-brand-gold" />
            )}
            <span>Issue & Post to Ledger</span>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Customer & Dates Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200">
          {/* Customer Selection */}
          <div className="md:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Customer *
              </label>
              <button
                type="button"
                onClick={() => setShowQuickCustomerModal(true)}
                className="text-[11px] text-brand-royal hover:underline font-semibold flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Quick Add</span>
              </button>
            </div>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.displayName} ({c.referenceNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Dates & Reference */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Issue Date *
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-gold/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-gold/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Reference / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Visa App #1094"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-gold/50"
              />
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Services & Line Items
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 text-xs text-brand-navy hover:text-brand-royal font-bold bg-amber-50 px-2.5 py-1 rounded border border-brand-gold/40 hover:bg-amber-100 transition"
            >
              <Plus className="w-3.5 h-3.5 text-brand-gold" />
              <span>Add Service Row</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3 w-56">Catalog Preset</th>
                  <th className="py-2.5 px-3 w-48">Service Name *</th>
                  <th className="py-2.5 px-3">Description / Applicant</th>
                  <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Rate (AED)</th>
                  <th className="py-2.5 px-3 w-24 text-right">Disc (AED)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total (AED)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-400 font-mono text-center">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <select
                        onChange={(e) => handleServiceSelect(idx, e.target.value)}
                        value={item.serviceId || ""}
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5 bg-white"
                      >
                        <option value="">— Quick Catalog —</option>
                        {services.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({formatAed(s.defaultRateFils)} AED)
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        required
                        value={item.serviceName}
                        onChange={(e) =>
                          handleItemChange(idx, "serviceName", e.target.value)
                        }
                        placeholder="Service title"
                        className="w-full text-xs font-semibold border border-slate-200 rounded p-1.5"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(idx, "description", e.target.value)
                        }
                        placeholder="Applicant name / notes"
                        className="w-full text-xs border border-slate-200 rounded p-1.5"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)
                        }
                        className="w-full text-center text-xs border border-slate-200 rounded p-1.5 font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={item.unitRateAed}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "unitRateAed",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full text-right text-xs border border-slate-200 rounded p-1.5 font-mono"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.discountAed}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "discountAed",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full text-right text-xs border border-slate-200 rounded p-1.5 font-mono text-emerald-700"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatAed(item.lineTotalAed, false)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Calculation & Words Summary */}
        <div className="grid grid-cols-12 gap-6 pt-4 border-t border-slate-200">
          <div className="col-span-12 md:col-span-7 space-y-3">
            <div className="p-3.5 bg-amber-50 rounded-lg border border-brand-gold/40 text-xs">
              <span className="text-[10px] font-bold text-brand-navy uppercase tracking-wider block mb-1">
                Official Amount in Words (UAE Standard):
              </span>
              <p className="font-bold text-slate-900 uppercase font-mono leading-relaxed">
                {totals.words}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Invoice Notes & Payment Instructions
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              ></textarea>
            </div>
          </div>

          <div className="col-span-12 md:col-span-5 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono font-semibold">
                {formatAed(totals.subtotal, false)} AED
              </span>
            </div>
            {totals.discounts > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discounts</span>
                <span className="font-mono font-semibold">
                  -{formatAed(totals.discounts, false)} AED
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-brand-navy border-t border-slate-300 pt-2">
              <span>Grand Total</span>
              <span className="font-mono text-lg">
                {formatAed(totals.grandTotal, false)} AED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showQuickCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-gold" />
              <span>Quick Add Customer</span>
            </h3>
            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Type
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={newCustType === "BUSINESS"}
                      onChange={() => setNewCustType("BUSINESS")}
                    />
                    <span>Business</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={newCustType === "INDIVIDUAL"}
                      onChange={() => setNewCustType("INDIVIDUAL")}
                    />
                    <span>Individual</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {newCustType === "BUSINESS" ? "Company Name *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Al Wasl Services LLC"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile / Phone *
                </label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomerModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-navy hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
