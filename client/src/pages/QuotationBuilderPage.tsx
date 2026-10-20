import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { formatAed, numberToAedWords, ICustomer, IService } from "@immigra/shared";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { showAppAlert } from "../services/alertService";

interface FormItem {
  serviceId?: string;
  serviceName: string;
  description: string;
  quantity: number;
  unitRateAed: number;
  discountAed: number;
  lineTotalAed: number;
}

export const QuotationBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [services, setServices] = useState<IService[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>(
    "Quotation valid for 30 days from date of issuance."
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    "Subject to UAE government fees prevailing at time of application submission."
  );

  const [items, setItems] = useState<FormItem[]>([
    {
      serviceName: "Golden Visa Consultancy",
      description: "Full family file preparation and nomination processing",
      quantity: 1,
      unitRateAed: 2500,
      discountAed: 0,
      lineTotalAed: 2500,
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, srvRes] = await Promise.all([
          api.get("/customers?limit=100"),
          api.get("/services?activeOnly=true"),
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
      } catch (err) {
        console.error("Error loading quotation data:", err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      showAppAlert("Please select a customer for this quotation", "Customer Required", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId,
        issueDate,
        expiryDate,
        items: items.map((i) => ({
          serviceId: i.serviceId,
          serviceName: i.serviceName,
          description: i.description,
          quantity: Number(i.quantity),
          unitRateAed: Number(i.unitRateAed),
          discountAed: Number(i.discountAed || 0),
        })),
        notes,
        termsAndConditions,
      };

      const res = await api.post("/quotations", payload);
      if (res.data.success) {
        navigate("/quotations");
      }
    } catch (err: any) {
      showAppAlert(err.response?.data?.message || "Failed to create quotation", "Creation Error", "error");
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/quotations"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create Quotation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft formal pricing proposals for prospective clients
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-brand-navy hover:bg-slate-900 text-white shadow-md transition border border-brand-gold/40 hover:border-brand-gold disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-brand-gold" />
          <span>{submitting ? "Saving..." : "Save Quotation"}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.displayName} ({c.referenceNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Issue Date *
            </label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Expiry Date *
            </label>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quotation Line Items
            </h2>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1 text-xs text-brand-navy font-bold bg-amber-50 px-2.5 py-1 rounded border border-brand-gold/40 hover:bg-amber-100"
            >
              <Plus className="w-3.5 h-3.5 text-brand-gold" />
              <span>Add Row</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3 w-56">Catalog Preset</th>
                  <th className="py-2.5 px-3 w-48">Service Name *</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Rate (AED)</th>
                  <th className="py-2.5 px-3 w-24 text-right">Disc (AED)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total (AED)</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-slate-400 font-mono text-center">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <select
                        onChange={(e) => handleServiceSelect(idx, e.target.value)}
                        value={item.serviceId || ""}
                        className="w-full text-[11px] border border-slate-200 rounded p-1.5"
                      >
                        <option value="">— Preset —</option>
                        {services.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
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
                        className="w-full text-xs border border-slate-200 rounded p-1.5"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="1"
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
                        className="w-full text-right text-xs border border-slate-200 rounded p-1.5 font-mono"
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

        <div className="grid grid-cols-12 gap-6 pt-4 border-t border-slate-200">
          <div className="col-span-12 md:col-span-7 space-y-3">
            <div className="p-3.5 bg-amber-50 rounded-lg border border-brand-gold/40 text-xs">
              <span className="text-[10px] font-bold text-brand-navy uppercase tracking-wider block mb-1">
                Official Amount in Words:
              </span>
              <p className="font-bold text-slate-900 uppercase font-mono">
                {totals.words}
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                rows={2}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
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
            <div className="flex justify-between text-base font-bold text-brand-navy border-t border-slate-300 pt-2">
              <span>Grand Total</span>
              <span className="font-mono text-lg">
                {formatAed(totals.grandTotal, false)} AED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
