import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { formatAed } from "@immigra/shared";
import immigraLogo from "../assets/immigra-logo.jpg";
import { CheckCircle2, XCircle, ShieldCheck, FileText, ArrowRight } from "lucide-react";

export const VerifyInvoicePage: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get("/invoices/verify", { params: { hash } });
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError("Invoice record not found.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Verification failed.");
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-brand-navy-light border-t-brand-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-center">
        {/* Top Brand Header */}
        <div className="bg-brand-navy p-6 text-center border-b border-brand-gold/40">
          <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden border-2 border-brand-gold shadow-lg mb-2 bg-white">
            <img src={immigraLogo} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-base font-bold text-white uppercase font-mono">
            IMMIGRA LINK BUSINESS SERVICES
          </h1>
          <p className="text-[10px] text-brand-gold font-semibold uppercase tracking-wider mt-0.5">
            Official Invoice Verification Portal
          </p>
        </div>

        <div className="p-6">
          {error ? (
            <div className="space-y-4 py-4">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Invalid or Unverified Invoice
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                The QR code or reference could not be matched with any genuine invoice recorded in our database.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Officially Verified Genuine Document</span>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {data.invoiceNumber}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Billed Customer:</span>
                  <span className="font-bold text-slate-800">
                    {data.customerName}
                  </span>
                </div>

                {data.companyName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Company Name:</span>
                    <span className="text-slate-700">{data.companyName}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Issue Date:</span>
                  <span className="text-slate-700 font-mono">
                    {new Date(data.issueDate).toLocaleDateString("en-GB")}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Invoice Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                    {data.status?.replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-900">Total Amount:</span>
                  <span className="font-mono font-extrabold text-brand-navy">
                    {formatAed(data.grandTotalFils)} AED
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400">
                Verified at: {new Date(data.verifiedAt).toLocaleString("en-AE", { timeZone: "Asia/Dubai" })} (Dubai Time)
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/login"
              className="text-xs text-brand-royal hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>Staff Login Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
