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
exports.InvoiceModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const shared_1 = require("@immigra/shared");
const InvoiceItemSchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Service" },
    serviceName: { type: String, required: true },
    clientName: { type: String, default: "" },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitRateFils: { type: Number, required: true, min: 0 },
    discountFils: { type: Number, default: 0 },
    lineTotalFils: { type: Number, required: true, min: 0 },
}, { _id: false });
const InvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    sequenceNumber: { type: Number, required: true, index: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    customerSnapshot: {
        displayName: { type: String, required: true },
        companyName: { type: String },
        contactPerson: { type: String },
        clientName: { type: String },
        phone: { type: String, required: true },
        email: { type: String },
        address: { type: String },
        trn: { type: String },
    },
    issueDate: { type: Date, required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    supplyDate: { type: Date },
    referenceNote: { type: String },
    status: {
        type: String,
        enum: Object.values(shared_1.InvoiceStatus),
        default: shared_1.InvoiceStatus.ISSUED,
        index: true,
    },
    subtotalFils: { type: Number, required: true, min: 0 },
    discountFils: { type: Number, default: 0 },
    taxFils: { type: Number, default: 0 },
    grandTotalFils: { type: Number, required: true, min: 0 },
    paidAmountFils: { type: Number, default: 0 },
    dueAmountFils: { type: Number, required: true },
    items: { type: [InvoiceItemSchema], required: true },
    amountInWords: { type: String, required: true },
    barcodeData: { type: String, required: true },
    qrVerificationHash: { type: String, required: true, unique: true, index: true },
    notes: { type: String },
    paymentTerms: { type: String },
    createdById: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    creatorName: { type: String },
    journalEntryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "JournalEntry" },
}, { timestamps: true });
InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ invoiceNumber: "text", "customerSnapshot.displayName": "text" });
exports.InvoiceModel = mongoose_1.default.model("Invoice", InvoiceSchema);
