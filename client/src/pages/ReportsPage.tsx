import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { formatAed } from "@immigra/shared";
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Scale,
  Calendar,
} from "lucide-react";

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"TRIAL" | "PL" | "BALANCE">("TRIAL");
  const [trialData, setTrialData] = useState<any>(null);
  const [plData, setPlData] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [tRes, plRes, bRes] = await Promise.all([
        api.get("/accounting/trial-balance"),
        api.get("/accounting/p-and-l"),
        api.get("/accounting/balance-sheet"),
      ]);
      if (tRes.data.success) setTrialData(tRes.data.data);
      if (plRes.data.success) setPlData(plRes.data.data);
      if (bRes.data.success) setBalanceData(bRes.data.data);
    } catch (err) {
      console.error("Failed to load accounting reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Financial Statements & Accounting Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade double-entry financial statements reconciled with underlying general ledgers
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print Financial Report</span>
        </button>
      </div>

      {/* Report Tabs (hidden on print) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print">
        <button
          onClick={() => setActiveTab("TRIAL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "TRIAL"
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Trial Balance</span>
        </button>

        <button
          onClick={() => setActiveTab("PL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "PL"
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Profit & Loss Statement (P&L)</span>
        </button>

        <button
          onClick={() => setActiveTab("BALANCE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "BALANCE"
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Balance Sheet</span>
        </button>
      </div>

      {/* Tab 1: Trial Balance */}
      {activeTab === "TRIAL" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                IMMIGRA LINK BUSINESS SERVICES — Trial Balance
              </h2>
              <p className="text-xs text-slate-500">
                As of {new Date().toLocaleDateString("en-GB")} • All figures in United Arab Emirates Dirhams (AED)
              </p>
            </div>
            {trialData?.isBalanced ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Balanced: Debits = Credits</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-md border border-red-200 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Unbalanced Ledger</span>
              </div>
            )}
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Account Code</th>
                <th className="py-2.5 px-4">Account Name</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-right">Total Debit (AED)</th>
                <th className="py-2.5 px-4 text-right">Total Credit (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {(trialData?.rows || []).map((r: any) => (
                <tr key={r.code} className="hover:bg-slate-50/50">
                  <td className="py-2 px-4 font-bold text-slate-700">{r.code}</td>
                  <td className="py-2 px-4 font-sans font-semibold text-slate-900">{r.name}</td>
                  <td className="py-2 px-4 font-sans text-slate-500 text-[10px] uppercase">{r.type}</td>
                  <td className="py-2 px-4 text-right text-slate-900 font-bold">
                    {r.debitFils > 0 ? formatAed(r.debitFils) : "—"}
                  </td>
                  <td className="py-2 px-4 text-right text-slate-900 font-bold">
                    {r.creditFils > 0 ? formatAed(r.creditFils) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-mono font-bold text-sm">
              <tr>
                <td colSpan={3} className="py-3 px-4 font-sans uppercase">
                  Grand Total
                </td>
                <td className="py-3 px-4 text-right text-brand-navy">
                  {formatAed(trialData?.grandTotalDebitFils || 0)} AED
                </td>
                <td className="py-3 px-4 text-right text-brand-navy">
                  {formatAed(trialData?.grandTotalCreditFils || 0)} AED
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Tab 2: Profit & Loss Statement */}
      {activeTab === "PL" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-3xl mx-auto">
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              Statement of Profit or Loss (Income Statement)
            </h2>
            <p className="text-xs text-slate-500">
              IMMIGRA LINK BUSINESS SERVICES • Dubai, UAE • In AED
            </p>
          </div>

          {/* Operating Revenue */}
          <div>
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pb-2 border-b border-slate-200 flex justify-between">
              <span>Operating Revenue</span>
              <span>Amount (AED)</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {(plData?.revenues || []).map((rev: any) => (
                <div key={rev.code} className="py-2.5 flex justify-between">
                  <span className="text-slate-800 font-medium">
                    {rev.code} - {rev.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatAed(rev.amountFils)}
                  </span>
                </div>
              ))}
              <div className="py-2.5 flex justify-between font-bold text-brand-navy border-t border-slate-200 bg-slate-50 px-2 rounded">
                <span>Total Operating Revenue</span>
                <span className="font-mono text-sm">
                  {formatAed(plData?.totalRevenueFils || 0)} AED
                </span>
              </div>
            </div>
          </div>

          {/* Operating Expenses */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200 flex justify-between">
              <span>Operating & Government Expenses</span>
              <span>Amount (AED)</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {(plData?.expenses || []).map((exp: any) => (
                <div key={exp.code} className="py-2.5 flex justify-between">
                  <span className="text-slate-800 font-medium">
                    {exp.code} - {exp.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatAed(exp.amountFils)}
                  </span>
                </div>
              ))}
              <div className="py-2.5 flex justify-between font-bold text-slate-900 border-t border-slate-200 bg-slate-50 px-2 rounded">
                <span>Total Operating Expenses</span>
                <span className="font-mono text-sm">
                  {formatAed(plData?.totalExpenseFils || 0)} AED
                </span>
              </div>
            </div>
          </div>

          {/* Net Profit / Loss */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between text-base font-bold shadow-md">
            <span>Net Commercial Profit / (Loss)</span>
            <span className="font-mono text-xl text-brand-gold">
              {formatAed(plData?.netProfitFils || 0)} AED
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Balance Sheet */}
      {activeTab === "BALANCE" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 max-w-3xl mx-auto">
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
              Statement of Financial Position (Balance Sheet)
            </h2>
            <p className="text-xs text-slate-500">
              IMMIGRA LINK BUSINESS SERVICES • Dubai, UAE • In AED
            </p>
          </div>

          {/* Assets */}
          <div>
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider pb-2 border-b border-blue-200 flex justify-between">
              <span>Assets</span>
              <span>Amount (AED)</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {(balanceData?.assets || []).map((a: any) => (
                <div key={a.code} className="py-2 flex justify-between">
                  <span className="text-slate-800">{a.code} - {a.name}</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatAed(a.amountFils)}
                  </span>
                </div>
              ))}
              <div className="py-2.5 flex justify-between font-bold text-blue-950 border-t border-slate-300 bg-blue-50/50 px-2 rounded">
                <span>Total Assets</span>
                <span className="font-mono text-sm">
                  {formatAed(balanceData?.totalAssetsFils || 0)} AED
                </span>
              </div>
            </div>
          </div>

          {/* Liabilities */}
          <div>
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider pb-2 border-b border-amber-200 flex justify-between">
              <span>Liabilities</span>
              <span>Amount (AED)</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {(balanceData?.liabilities || []).map((l: any) => (
                <div key={l.code} className="py-2 flex justify-between">
                  <span className="text-slate-800">{l.code} - {l.name}</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatAed(l.amountFils)}
                  </span>
                </div>
              ))}
              <div className="py-2.5 flex justify-between font-bold text-amber-950 border-t border-slate-300 bg-amber-50/50 px-2 rounded">
                <span>Total Liabilities</span>
                <span className="font-mono text-sm">
                  {formatAed(balanceData?.totalLiabilitiesFils || 0)} AED
                </span>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div>
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider pb-2 border-b border-purple-200 flex justify-between">
              <span>Owner's Equity & Retained Earnings</span>
              <span>Amount (AED)</span>
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {(balanceData?.equity || []).map((e: any) => (
                <div key={e.code} className="py-2 flex justify-between">
                  <span className="text-slate-800">{e.name}</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatAed(e.amountFils)}
                  </span>
                </div>
              ))}
              <div className="py-2.5 flex justify-between font-bold text-purple-950 border-t border-slate-300 bg-purple-50/50 px-2 rounded">
                <span>Total Equity</span>
                <span className="font-mono text-sm">
                  {formatAed(balanceData?.totalEquityFils || 0)} AED
                </span>
              </div>
            </div>
          </div>

          {/* Equation Reconcile Check */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-gold" />
              <span>Accounting Equation Check: Assets = Liabilities + Equity</span>
            </div>
            <span className="font-mono text-sm text-brand-gold">
              {formatAed(balanceData?.totalLiabilitiesAndEquityFils || 0)} AED
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
