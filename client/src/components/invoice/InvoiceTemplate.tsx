import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { formatAed, IInvoice } from "@immigra/shared";
import deepxLogo from "../../assets/deepx-logo.png";

interface InvoiceTemplateProps {
  invoice: IInvoice;
  companySettings?: any;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  companySettings,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const barcodeRef = React.useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    // Generate QR Code linking to verification page
    const verifyUrl = `${window.location.origin}/verify-invoice/${invoice.qrVerificationHash || invoice.invoiceNumber}`;
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 90,
      color: {
        dark: "#06183D",
        light: "#FFFFFF",
      },
    }).then((url) => setQrCodeDataUrl(url));

    // Render Barcode
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, invoice.invoiceNumber, {
          format: "CODE128",
          displayValue: false,
          margin: 0,
          height: 32,
          width: 1.4,
          lineColor: "#000000",
        });
      } catch (err) {
        console.error("Barcode rendering error:", err);
      }
    }
  }, [invoice]);

  const company = companySettings || {
    companyName: "DeepX Ai Solutions",
    address: "Dubai, United Arab Emirates",
    phone: "",
    email: "info.deepxaisol@gmail.com",
  };

  const formattedDate = new Date(invoice.issueDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div
      id="invoice-printable"
      className="print-page bg-white text-slate-900 border border-slate-200 rounded-xl shadow-xl max-w-4xl mx-auto p-10 font-sans"
      style={{ minHeight: "1120px" }}
    >
      {/* Top Header Grid */}
      <div className="flex justify-between items-start border-b-2 border-slate-900/10 pb-6 mb-6">
        {/* Company Brand Logo & Name */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 rounded-xl overflow-hidden border border-brand-gold/50 shadow-sm flex-shrink-0 bg-white p-1 flex items-center justify-center">
            <img
              src={deepxLogo}
              alt="DeepX Ai Solutions"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-brand-navy font-sans">
              {company.companyName}
            </h1>
            <p className="text-xs text-brand-gold font-bold tracking-wider uppercase">
              AI Solutions & Business Management
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">{company.address}</p>
            <p className="text-[11px] text-slate-600">
              Email: <strong>{company.email}</strong>{company.phone ? ` • Mob: ${company.phone}` : ""}
            </p>
          </div>
        </div>

        {/* Invoice Title & Barcode */}
        <div className="text-right flex flex-col items-end">
          <h2 className="text-2xl font-black tracking-wider text-slate-950 uppercase font-mono">
            INVOICE
          </h2>
          <div className="mt-1 flex flex-col items-end">
            <svg ref={barcodeRef} className="h-8 max-w-[170px]"></svg>
            <span className="text-[10px] font-mono tracking-widest text-slate-600 font-bold uppercase mt-0.5">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-2 space-y-0.5">
            <div>
              Generated on: <strong>{formattedDate}</strong>
            </div>
            <div>
              Created By: <strong>{invoice.creatorName || "Admin"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Addresses / Billing To Details */}
      <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
        {/* Service Provider */}
        <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200/80">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Service Provider
          </div>
          <div className="font-bold text-slate-900 text-sm">{company.companyName}</div>
          <div className="text-slate-600 mt-1">{company.address}</div>
          <div className="text-slate-600">Mob: {company.phone}</div>
          <div className="text-slate-600">Email: {company.email}</div>
          <div className="mt-2 text-[10px] font-semibold text-brand-royal inline-block bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            UAE Commercial Invoicing (Non-VAT)
          </div>
        </div>

        {/* Billing to */}
        <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200/80">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Billing to
          </div>
          <div className="font-bold text-slate-900 text-sm">
            {invoice.customerSnapshot?.companyName || invoice.customerSnapshot?.displayName}
          </div>
          {invoice.customerSnapshot?.phone ? (
            <div className="text-slate-600 mt-1">
              Contact No: <strong>{invoice.customerSnapshot.phone}</strong>
            </div>
          ) : null}
          {invoice.customerSnapshot?.email && (
            <div className="text-slate-600">Email: {invoice.customerSnapshot.email}</div>
          )}
          {invoice.customerSnapshot?.address && (
            <div className="text-slate-600 mt-0.5">{invoice.customerSnapshot.address}</div>
          )}
        </div>
      </div>

      {/* Service Table */}
      <div className="mb-6 overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
        <table className="w-full text-left text-xs border-collapse min-w-[600px] sm:min-w-full">
          <thead>
            <tr className="bg-brand-navy text-white font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Service</th>
              <th className="py-2.5 px-3">Client Name</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-center w-14">Qty</th>
              <th className="py-2.5 px-3 text-right w-24">Fees/Rate</th>
              <th className="py-2.5 px-3 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoice.items.map((item: any, idx: number) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
              >
                <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                  {idx + 1}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  {item.serviceName}
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800">
                  {item.clientName || "—"}
                </td>
                <td className="py-2.5 px-3 text-slate-600">{item.description || "—"}</td>
                <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {formatAed(item.unitRateFils)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {formatAed(item.lineTotalFils)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary & Totals */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Left Notes & In Words */}
        <div className="col-span-7 flex flex-col justify-between">
          <div className="bg-amber-50/80 border border-brand-gold/40 rounded-lg p-3.5 text-xs text-slate-800">
            <span className="font-bold text-brand-navy uppercase text-[10px] tracking-wider block mb-1">
              Amount in Words:
            </span>
            <div className="font-bold uppercase tracking-wide text-slate-900 leading-relaxed font-mono">
              {invoice.amountInWords}
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 space-y-1">
            <p>
              <strong>Payment Terms:</strong> {invoice.paymentTerms || "Payable upon invoice receipt."}
            </p>
            {invoice.notes && (
              <p>
                <strong>Notes:</strong> {invoice.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Totals Breakdown */}
        <div className="col-span-5 bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-semibold">{formatAed(invoice.subtotalFils)} AED</span>
          </div>

          {invoice.discountFils > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discounts</span>
              <span className="font-mono font-semibold">-{formatAed(invoice.discountFils)} AED</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-bold text-brand-navy border-t border-slate-300 pt-2">
            <span>Grand Total</span>
            <span className="font-mono text-base">{formatAed(invoice.grandTotalFils)} AED</span>
          </div>

          <div className="flex justify-between text-slate-600 pt-1">
            <span>Paid Amount</span>
            <span className="font-mono font-semibold text-emerald-700">
              {formatAed(invoice.paidAmountFils)} AED
            </span>
          </div>

          <div className="flex justify-between text-sm font-bold text-red-600 border-t border-slate-300 pt-2">
            <span>Amount Due</span>
            <span className="font-mono text-base">{formatAed(invoice.dueAmountFils)} AED</span>
          </div>
        </div>
      </div>

      {/* Footer Instructions & Scannable QR */}
      <div className="border-t-2 border-slate-200 pt-6 mt-8 flex justify-between items-center text-xs">
        {/* Payment instructions */}
        <div className="space-y-1 text-slate-600 max-w-md">
          <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">
            Payment & Settlement Instructions
          </div>
          <p className="text-[11px] text-slate-600">
            {invoice.paymentTerms || "Please settle payment via cash or direct transfer."}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Please use invoice number <strong>{invoice.invoiceNumber}</strong> as reference for all payments.
          </p>
        </div>

        {/* QR Verification Seal */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="Scan to Verify"
              className="w-16 h-16 rounded border border-slate-300 bg-white"
            />
          ) : (
            <div className="w-16 h-16 bg-slate-200 rounded"></div>
          )}
          <div className="text-left">
            <div className="text-[10px] font-bold text-brand-navy uppercase tracking-wider">
              Official QR Seal
            </div>
            <div className="text-[9px] text-slate-500">Scan to verify invoice</div>
            <div className="text-[8px] font-mono text-slate-400 mt-1 uppercase">
              DEEPX AI AUTH
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
