import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import immigraLogo from "../assets/immigra-logo.jpg";
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("info.deepxaisol@gmail.com");
  const [password, setPassword] = useState("DeepX)88##");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-navy-light/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        {/* Top Header Card */}
        <div className="bg-brand-navy p-6 text-center border-b border-brand-gold/40 relative">
          <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden border-2 border-brand-gold shadow-lg mb-3 bg-white">
            <img
              src={immigraLogo}
              alt="IMMIGRA LINK"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            IMMIGRA LINK
          </h2>
          <p className="text-xs text-brand-gold font-semibold tracking-wider uppercase mt-0.5">
            Business Management & Invoicing System
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-slate-900/60 border border-slate-700 text-[10px] text-slate-300">
            <ShieldCheck className="w-3 h-3 text-brand-gold" />
            <span>Dubai, United Arab Emirates (Asia/Dubai)</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition text-slate-900"
                  placeholder="info.deepxaisol@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold transition text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-brand-navy to-brand-royal hover:from-slate-900 hover:to-brand-navy text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow-md shadow-brand-navy/30 transition flex items-center justify-center gap-2 border border-brand-gold/30 hover:border-brand-gold disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="w-4 h-4 text-brand-gold" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2.5">
              Super Admin Quick Fill
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin("info.deepxaisol@gmail.com", "DeepX)88##")}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 hover:border-brand-gold hover:bg-amber-50/50 text-slate-800 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-brand-gold" />
              <span>DeepX Admin (info.deepxaisol@gmail.com)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
