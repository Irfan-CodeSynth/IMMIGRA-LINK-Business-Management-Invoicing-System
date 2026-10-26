"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySettingsModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CompanySettingsSchema = new mongoose_1.Schema({
    companyName: { type: String, default: "DeepX Ai Solutions" },
    country: { type: String, default: "United Arab Emirates" },
    city: { type: String, default: "Dubai" },
    address: { type: String, default: "Al Garhoud, Dubai, United Arab Emirates" },
    phone: { type: String, default: "+971 4 295 5555" },
    email: { type: String, default: "info.deepxaisol@gmail.com" },
    website: { type: String, default: "www.deepxai.com" },
    tradeLicenseNumber: { type: String, default: "CN-1094829" },
    trn: { type: String, default: "" },
    isVatRegistered: { type: Boolean, default: false },
    currency: { type: String, default: "AED" },
    timezone: { type: String, default: "Asia/Dubai" },
    bankDetails: {
        bankName: { type: String, default: "Emirates NBD" },
        accountTitle: { type: String, default: "DeepX Ai Solutions" },
        accountNumber: { type: String, default: "1019283746501" },
        iban: { type: String, default: "AE3402600001019283746501" },
        swiftCode: { type: String, default: "EBIBAEAD" },
        branch: { type: String, default: "Deira Main Branch, Dubai" },
    },
    invoicePrefix: { type: String, default: "INV-" },
    invoiceNextSequence: { type: Number, default: 1 },
    invoiceDefaultNotes: {
        type: String,
        default: "Thank you for choosing DeepX Ai Solutions. For inquiries regarding this invoice, please contact info.deepxaisol@gmail.com.",
    },
    invoicePaymentInstructions: {
        type: String,
        default: "Please make payment via Bank Transfer or Cash at our office counter. Mention the invoice number as the payment reference.",
    },
    logoUrl: { type: String, default: "/src/assets/deepx-logo.png" },
}, { timestamps: true });
exports.CompanySettingsModel = mongoose_1.default.model("CompanySettings", CompanySettingsSchema);
