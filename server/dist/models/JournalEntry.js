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
exports.JournalEntryModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const JournalLineSchema = new mongoose_1.Schema({
    accountCode: { type: String, required: true },
    accountName: { type: String, required: true },
    description: { type: String },
    debitFils: { type: Number, default: 0, min: 0 },
    creditFils: { type: Number, default: 0, min: 0 },
}, { _id: false });
const JournalEntrySchema = new mongoose_1.Schema({
    entryNumber: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true, index: true },
    description: { type: String, required: true },
    sourceDocumentType: {
        type: String,
        enum: ["INVOICE", "PAYMENT", "EXPENSE", "MANUAL", "OPENING_BALANCE"],
        required: true,
        index: true,
    },
    sourceDocumentId: { type: mongoose_1.Schema.Types.ObjectId },
    lines: { type: [JournalLineSchema], required: true },
    totalDebitFils: { type: Number, required: true },
    totalCreditFils: { type: Number, required: true },
    isReversed: { type: Boolean, default: false },
    reversedEntryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "JournalEntry" },
    createdById: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
JournalEntrySchema.pre("validate", function (next) {
    let debitSum = 0;
    let creditSum = 0;
    for (const line of this.lines) {
        debitSum += line.debitFils || 0;
        creditSum += line.creditFils || 0;
    }
    this.totalDebitFils = debitSum;
    this.totalCreditFils = creditSum;
    if (debitSum !== creditSum) {
        return next(new Error(`Journal entry unbalanced! Debits: ${debitSum} fils vs Credits: ${creditSum} fils`));
    }
    next();
});
exports.JournalEntryModel = mongoose_1.default.model("JournalEntry", JournalEntrySchema);
