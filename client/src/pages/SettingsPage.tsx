import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import immigraLogo from "../assets/immigra-logo.jpg";
import {
  Settings,
  Building,
  CreditCard,
  FileText,
  Save,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [companyName, setCompanyName] = useState("IMMIGRA LINK BUSINESS SERVICES");
  const [address, setAddress] = useState("Al Garhoud, Dubai, United Arab Emirates");
  const [phone, setPhone] = useState("+971 50 585 6318");
  const [email, setEmail] = useState("info@immigralink.ae");
  const [website, setWebsite] = useState("www.immigralink.ae");
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState("CN-1094829");
  const [isVatRegistered, setIsVatRegistered] = useState(false);

  // Bank
  const [bankName, setBankName] = useState("Emirates NBD");
  const [accountTitle, setAccountTitle] = useState("IMMIGRA LINK BUSINESS SERVICES");
  const [accountNumber, setAccountNumber] = useState("1019283746501");
  const [iban, setIban] = useState("AE3402600001019283746501");
  const [swiftCode, setSwiftCode] = useState("EBIBAEAD");

  // Invoice Template
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [invoiceNextSequence, setInvoiceNextSequence] = useState<number>(1);
  const [invoiceDefaultNotes, setInvoiceDefaultNotes] = useState(
    "Thank you for trusting Immigra Link Business Services. For questions regarding this invoice, contact info@immigralink.ae."
  );
  const [invoicePaymentInstructions, setInvoicePaymentInstructions] = useState(
    "Please transfer payment to Emirates NBD (IBAN: AE3402600001019283746501) with invoice # reference."
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        if (res.data.success && res.data.data) {
          const s = res.data.data;
          setCompanyName(s.companyName);
          setAddress(s.address);
          setPhone(s.phone);
          setEmail(s.email);
          setWebsite(s.website || "");
          setTradeLicenseNumber(s.tradeLicenseNumber || "");
          setIsVatRegistered(s.isVatRegistered || false);
          if (s.bankDetails) {
            setBankName(s.bankDetails.bankName || "");
            setAccountTitle(s.bankDetails.accountTitle || "");
            setAccountNumber(s.bankDetails.accountNumber || "");
            setIban(s.bankDetails.iban || "");
            setSwiftCode(s.bankDetails.swiftCode || "");
          }
          if (s.invoicePrefix) setInvoicePrefix(s.invoicePrefix);
          if (s.invoiceNextSequence) setInvoiceNextSequence(s.invoiceNextSequence);
          if (s.invoiceDefaultNotes) setInvoiceDefaultNotes(s.invoiceDefaultNotes);
          if (s.invoicePaymentInstructions) setInvoicePaymentInstructions(s.invoicePaymentInstructions);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      const payload = {
        companyName,
        country: "United Arab Emirates",
        city: "Dubai",
        address,
        phone,
        email,
        website,
        tradeLicenseNumber,
        isVatRegistered,
        currency: "AED",
        timezone: "Asia/Dubai",
        bankDetails: {
          bankName,
          accountTitle,
          accountNumber,
          iban,
          swiftCode,
        },
        invoicePrefix,
        invoiceNextSequence: Number(invoiceNextSequence) || 1,
        invoiceDefaultNotes,
        invoicePaymentInstructions,
      };

      const res = await api.put("/settings", payload);
      if (res.data.success) {
        setSuccessMsg("Settings updated successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-navy border-t-brand-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Company Profile & Invoicing Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Legal UAE business identity, bank coordinates, and invoice customization
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-brand-navy hover:bg-slate-900 text-white shadow-md transition border border-brand-gold/40 hover:border-brand-gold disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-brand-gold" />
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Brand & Legal Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-brand-gold bg-white p-0.5 shadow">
              <img src={immigraLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase">
                Official Company Identity
              </h2>
              <p className="text-slate-500 text-[11px]">
                Branding reflected on printed A4 invoices, quotations, and official receipts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trade License Number</label>
              <input
                type="text"
                value={tradeLicenseNumber}
                onChange={(e) => setTradeLicenseNumber(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">UAE VAT Registration Status</span>
              <span className="text-[10px] text-slate-500">
                Currently non-VAT registered (invoices issued without VAT charges)
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={isVatRegistered}
                onChange={(e) => setIsVatRegistered(e.target.checked)}
                className="rounded border-slate-300 text-brand-navy"
              />
              <span>VAT Registered</span>
            </label>
          </div>
        </div>

        {/* Bank Transfer Details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200">
            <CreditCard className="w-4 h-4 text-brand-gold" />
            <span>Bank Transfer Coordinates (Printed on Invoices)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Title</label>
              <input
                type="text"
                required
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">IBAN Number</label>
              <input
                type="text"
                required
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-brand-royal"
              />
            </div>
          </div>
        </div>

        {/* Invoicing Template Defaults */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200">
            <FileText className="w-4 h-4 text-brand-gold" />
            <span>Invoicing Numbering & Notes</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                required
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="e.g. INV- or INV/MAIN/"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Prefix before the sequence number (e.g. <code className="font-mono text-brand-navy font-bold">INV-</code> or <code className="font-mono text-brand-navy font-bold">INV/MAIN/</code>).
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Next Invoice Number (Starts from 1)
              </label>
              <input
                type="number"
                min="1"
                required
                value={invoiceNextSequence}
                onChange={(e) => setInvoiceNextSequence(parseInt(e.target.value) || 1)}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Sequential counter starting number. Set to 1 for <code className="font-mono text-brand-navy font-bold">001</code>.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg text-white flex items-center justify-between border border-brand-gold/30">
            <span className="text-xs text-slate-300 font-medium">Live Preview of Next Invoice ID:</span>
            <span className="font-mono text-sm font-bold text-brand-gold bg-slate-800 px-3 py-1 rounded border border-slate-700">
              {invoicePrefix}
              {invoiceNextSequence < 1000
                ? String(invoiceNextSequence).padStart(3, "0")
                : String(invoiceNextSequence)}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Invoice Footer Notes
            </label>
            <textarea
              rows={2}
              value={invoiceDefaultNotes}
              onChange={(e) => setInvoiceDefaultNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2"
            ></textarea>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Payment Terms & Instructions
            </label>
            <textarea
              rows={2}
              value={invoicePaymentInstructions}
              onChange={(e) => setInvoicePaymentInstructions(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2"
            ></textarea>
          </div>
        </div>
      </form>
    </div>
  );
};
