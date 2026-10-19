import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { formatAed, ICustomer, IInvoice, IPayment } from "@immigra/shared";
import {
  ArrowLeft,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Printer,
  ChevronRight,
  Clock,
  ShieldCheck,
} from "lucide-react";

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [activeTab, setActiveTab] = useState<"INVOICES" | "PAYMENTS" | "STATEMENT">("INVOICES");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const res = await api.get(`/customers/${id}`);
        if (res.data.success) {
          setCustomer(res.data.data.customer);
          setInvoices(res.data.data.invoices || []);
          setPayments(res.data.data.payments || []);
        }
      } catch (err) {
        console.error("Failed to load customer profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-navy border-t-brand-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12 text-slate-500 text-xs">
        Customer profile not found.
      </div>
    );
  }

  // Combine invoices and payments chronologically for statement
  const statementEntries: any[] = [];
  invoices.forEach((inv) => {
    statementEntries.push({
      date: new Date(inv.issueDate),
      type: "INVOICE",
      ref: inv.invoiceNumber,
      description: `Invoice Issued (${inv.items.length} items)`,
      debitFils: inv.grandTotalFils,
      creditFils: 0,
    });
  });
  payments.forEach((pay) => {
    statementEntries.push({
      date: new Date(pay.paymentDate),
      type: "PAYMENT",
      ref: pay.receiptNumber,
      description: `Payment Received (${pay.paymentMethod})`,
      debitFils: 0,
      creditFils: pay.amountFils,
    });
  });
  statementEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalanceFils = 0;
  const computedStatement = statementEntries.map((row) => {
    runningBalanceFils += row.debitFils - row.creditFils;
    return {
      ...row,
      balanceFils: runningBalanceFils,
    };
  });

  return (
    <div className="space-y-6">
      {/* Back button and Profile Header Card */}
      <div className="flex items-center gap-3">
        <Link
          to="/customers"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Customer 360 Profile
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full transactional overview, ledger history, and statements
          </p>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              {customer.referenceNumber}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                customer.customerType === "BUSINESS"
                  ? "bg-blue-50 text-brand-royal"
                  : "bg-purple-50 text-purple-700"
              }`}
            >
              {customer.customerType}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 leading-tight">
            {customer.displayName}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.tradeLicenseNumber && (
              <div>Trade License: <strong>{customer.tradeLicenseNumber}</strong></div>
            )}
            <div>Location: <strong>{customer.address?.city || "Dubai"}, UAE</strong></div>
          </div>
        </div>

        {/* Outstanding Balance Banner */}
        <div className="bg-gradient-to-br from-brand-navy to-brand-navy-light text-white rounded-xl p-5 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="text-xs font-semibold text-brand-gold uppercase tracking-wider flex items-center justify-between">
            <span>Outstanding Balance</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-bold font-mono text-white">
              {formatAed(customer.balanceFils)}{" "}
              <span className="text-xs font-normal text-slate-300 font-sans">AED</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-300">
            Net receivable across all issued invoices
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("INVOICES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "INVOICES"
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PAYMENTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "PAYMENTS"
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payments ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("STATEMENT")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "STATEMENT"
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Customer Ledger Statement</span>
        </button>
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === "INVOICES" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total (AED)</th>
                <th className="py-3 px-4 text-right">Paid (AED)</th>
                <th className="py-3 px-4 text-right">Due (AED)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No invoices issued to this customer yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-brand-navy">
                      <Link to={`/invoices/${inv._id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.issueDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {formatAed(inv.grandTotalFils)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600">
                      {formatAed(inv.paidAmountFils)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                      {formatAed(inv.dueAmountFils)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="text-brand-royal hover:underline font-semibold"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeTab === "PAYMENTS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Deposit Account</th>
                <th className="py-3 px-4 text-right">Amount (AED)</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No payment receipts recorded for this customer.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.depositAccountCode}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +{formatAed(p.amountFils)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.notes || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Tab 3: Customer Statement / Ledger */}
      {activeTab === "STATEMENT" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Statement of Account
              </h3>
              <p className="text-xs text-slate-500">
                Running transactional ledger from earliest transaction to current date
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Statement</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Transaction</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3 text-right">Debit (AED)</th>
                <th className="py-2.5 px-3 text-right">Credit (AED)</th>
                <th className="py-2.5 px-3 text-right">Balance (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {computedStatement.map((st, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-slate-600">
                    {st.date.toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                    {st.description}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-brand-navy">{st.ref}</td>
                  <td className="py-2.5 px-3 text-right text-slate-900">
                    {st.debitFils > 0 ? formatAed(st.debitFils) : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">
                    {st.creditFils > 0 ? formatAed(st.creditFils) : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatAed(st.balanceFils)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};
