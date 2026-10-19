import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { formatAed, IAccount, IJournalEntry, AccountType } from "@immigra/shared";
import {
  BookOpen,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Plus,
  Trash2,
} from "lucide-react";

export const AccountingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"CHART" | "JOURNALS" | "LEDGER">("CHART");
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [journals, setJournals] = useState<IJournalEntry[]>([]);
  const [ledgerLines, setLedgerLines] = useState<any[]>([]);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Manual Journal Modal
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split("T")[0]);
  const [journalDescription, setJournalDescription] = useState("");
  const [journalLines, setJournalLines] = useState([
    { accountCode: "1010", accountName: "Cash in Hand", debitAed: 0, creditAed: 0, description: "" },
    { accountCode: "4010", accountName: "Document Clearing Revenue", debitAed: 0, creditAed: 0, description: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/accounting/chart");
      if (res.data.success) {
        setAccounts(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  const fetchJournals = async () => {
    try {
      const res = await api.get("/accounting/journals");
      if (res.data.success) {
        setJournals(res.data.data.entries);
      }
    } catch (err) {
      console.error("Error fetching journals:", err);
    }
  };

  const fetchLedger = async (accCode?: string) => {
    try {
      let url = "/accounting/ledger";
      if (accCode) url += `?accountCode=${accCode}`;
      const res = await api.get(url);
      if (res.data.success) {
        setLedgerLines(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching ledger:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAccounts(), fetchJournals(), fetchLedger()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleAccountChange = (index: number, code: string) => {
    const acc = accounts.find((a) => a.code === code);
    if (!acc) return;
    setJournalLines((prev) => {
      const copy = [...prev];
      copy[index].accountCode = acc.code;
      copy[index].accountName = acc.name;
      return copy;
    });
  };

  const handleLineChange = (index: number, field: string, val: any) => {
    setJournalLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addLine = () => {
    setJournalLines((prev) => [
      ...prev,
      { accountCode: "1010", accountName: "Cash in Hand", debitAed: 0, creditAed: 0, description: "" },
    ]);
  };

  const removeLine = (index: number) => {
    if (journalLines.length <= 2) return;
    setJournalLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalDebit = journalLines.reduce((s, l) => s + (Number(l.debitAed) || 0), 0);
  const totalCredit = journalLines.reduce((s, l) => s + (Number(l.creditAed) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert("Journal entry must be balanced (Debits must equal Credits)!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: journalDate,
        description: journalDescription,
        lines: journalLines.map((l) => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          description: l.description,
          debitFils: Math.round(Number(l.debitAed) * 100),
          creditFils: Math.round(Number(l.creditAed) * 100),
        })),
      };

      const res = await api.post("/accounting/manual-journal", payload);
      if (res.data.success) {
        setShowJournalModal(false);
        setJournalDescription("");
        await fetchJournals();
        await fetchAccounts();
        await fetchLedger();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to post journal entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Double-Entry Accounting Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compliant financial ledger with real balanced journal entries and automated posting
          </p>
        </div>

        <button
          onClick={() => setShowJournalModal(true)}
          className="flex items-center gap-2 bg-brand-navy hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition border border-brand-gold/40 hover:border-brand-gold"
        >
          <PlusCircle className="w-4 h-4 text-brand-gold" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("CHART")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "CHART"
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Chart of Accounts ({accounts.length})
        </button>

        <button
          onClick={() => setActiveTab("JOURNALS")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "JOURNALS"
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Journal Entries ({journals.length})
        </button>

        <button
          onClick={() => setActiveTab("LEDGER")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === "LEDGER"
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          General Ledger
        </button>
      </div>

      {/* Tab 1: Chart of Accounts */}
      {activeTab === "CHART" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Sub-Type</th>
                <th className="py-3 px-4 text-right">Current Balance (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <tr key={acc.code} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {acc.code}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {acc.name}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        acc.type === AccountType.ASSET
                          ? "bg-blue-50 text-blue-700"
                          : acc.type === AccountType.LIABILITY
                          ? "bg-amber-50 text-amber-700"
                          : acc.type === AccountType.EQUITY
                          ? "bg-purple-50 text-purple-700"
                          : acc.type === AccountType.REVENUE
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {acc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {acc.subType}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatAed(acc.currentBalanceFils)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Journal Entries */}
      {activeTab === "JOURNALS" && (
        <div className="space-y-4">
          {journals.map((entry) => (
            <div
              key={entry._id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-brand-navy">
                    {entry.entryNumber}
                  </span>
                  <span className="text-slate-500">
                    {new Date(entry.date).toLocaleDateString("en-GB")}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {entry.description}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {entry.sourceDocumentType}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-700">
                    Balanced: {formatAed(entry.totalDebitFils)} AED
                  </span>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100 text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-4">Account</th>
                    <th className="py-2 px-4">Description</th>
                    <th className="py-2 px-4 text-right w-32">Debit (AED)</th>
                    <th className="py-2 px-4 text-right w-32">Credit (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {entry.lines.map((line: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-4 font-sans font-semibold text-slate-900">
                        {line.accountCode} - {line.accountName}
                      </td>
                      <td className="py-2 px-4 text-slate-500 font-sans">
                        {line.description || "—"}
                      </td>
                      <td className="py-2 px-4 text-right font-bold text-slate-900">
                        {line.debitFils > 0 ? formatAed(line.debitFils) : "—"}
                      </td>
                      <td className="py-2 px-4 text-right font-bold text-slate-900">
                        {line.creditFils > 0 ? formatAed(line.creditFils) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: General Ledger */}
      {activeTab === "LEDGER" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                General Ledger Activity
              </h3>
              <p className="text-xs text-slate-500">
                Detailed audit trail across all debit and credit line transactions
              </p>
            </div>

            <select
              value={selectedLedgerAccount}
              onChange={(e) => {
                setSelectedLedgerAccount(e.target.value);
                fetchLedger(e.target.value);
              }}
              className="text-xs border border-slate-300 rounded-lg p-2 bg-slate-50"
            >
              <option value="">— All Chart Accounts —</option>
              {accounts.map((acc) => (
                <option key={acc.code} value={acc.code}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Entry #</th>
                  <th className="py-2.5 px-3">Account</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (AED)</th>
                  <th className="py-2.5 px-3 text-right">Credit (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {ledgerLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-600">
                      {new Date(line.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-brand-navy">
                      {line.entryNumber}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                      {line.accountCode} - {line.accountName}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">
                      {line.lineDescription || line.description}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {line.debitFils > 0 ? formatAed(line.debitFils) : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {line.creditFils > 0 ? formatAed(line.creditFils) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Journal Entry Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-gold" />
                <span>Post Manual Journal Entry</span>
              </h3>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostJournal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entry Date *</label>
                  <input
                    type="date"
                    required
                    value={journalDate}
                    onChange={(e) => setJournalDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description / Memo *</label>
                  <input
                    type="text"
                    required
                    value={journalDescription}
                    onChange={(e) => setJournalDescription(e.target.value)}
                    placeholder="e.g. End of Month Depreciation / Adjustment"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Lines Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-56">Account</th>
                      <th className="p-2">Line Memo</th>
                      <th className="p-2 text-right w-28">Debit (AED)</th>
                      <th className="p-2 text-right w-28">Credit (AED)</th>
                      <th className="p-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journalLines.map((line, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select
                            value={line.accountCode}
                            onChange={(e) => handleAccountChange(idx, e.target.value)}
                            className="w-full border border-slate-200 rounded p-1 text-[11px]"
                          >
                            {accounts.map((a) => (
                              <option key={a.code} value={a.code}>
                                {a.code} - {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                            placeholder="Optional memo"
                            className="w-full border border-slate-200 rounded p-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.debitAed}
                            onChange={(e) => handleLineChange(idx, "debitAed", parseFloat(e.target.value) || 0)}
                            className="w-full text-right font-mono border border-slate-200 rounded p-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.creditAed}
                            onChange={(e) => handleLineChange(idx, "creditAed", parseFloat(e.target.value) || 0)}
                            className="w-full text-right font-mono border border-slate-200 rounded p-1"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            disabled={journalLines.length <= 2}
                            className="text-slate-400 hover:text-red-500 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={addLine}
                  className="text-brand-royal font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Line</span>
                </button>

                <div className="flex items-center gap-4 font-mono font-bold">
                  <span>Debits: {formatAed(totalDebit, false)} AED</span>
                  <span>Credits: {formatAed(totalCredit, false)} AED</span>
                  {isBalanced ? (
                    <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Balanced
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1 text-[11px] font-sans">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Unbalanced
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || submitting}
                  className="px-4 py-2 bg-brand-navy hover:bg-slate-900 text-white font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Post Balanced Journal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
