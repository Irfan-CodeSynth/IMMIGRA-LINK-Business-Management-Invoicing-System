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
exports.SequenceModel = void 0;
exports.formatSequence = formatSequence;
exports.getNextSequence = getNextSequence;
exports.peekNextSequence = peekNextSequence;
const mongoose_1 = __importStar(require("mongoose"));
const SequenceSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true },
    sequence: { type: Number, required: true, default: 1000 },
});
exports.SequenceModel = mongoose_1.default.model("Sequence", SequenceSchema);
/**
 * Format a sequence number:
 * - If sequence < 1000, pads with leading zeros (e.g. 3 -> "003" for "INV-003")
 * - If sequence >= 1000, returns natural string (e.g. 1165 -> "1165" for "INV/MAIN/1165")
 */
function formatSequence(seq, minPadding = 3) {
    if (seq < 1000) {
        return String(seq).padStart(minPadding, "0");
    }
    return String(seq);
}
/**
 * Get or determine the starting sequence number based on existing documents.
 */
async function resolveInitialSequence(key, fallbackDefault = 1000) {
    try {
        if (key === "INVOICE_SEQUENCE") {
            const docs = await mongoose_1.default.connection
                .collection("invoices")
                .find({})
                .sort({ sequenceNumber: -1 })
                .limit(1)
                .toArray();
            if (docs.length > 0 && typeof docs[0].sequenceNumber === "number" && docs[0].sequenceNumber >= 1000) {
                return docs[0].sequenceNumber;
            }
            return 1165; // Matches the official Immigra Link reference invoice INV/MAIN/1165
        }
        if (key === "QUOTATION_SEQUENCE") {
            const docs = await mongoose_1.default.connection
                .collection("quotations")
                .find({})
                .sort({ createdAt: -1 })
                .limit(1)
                .toArray();
            if (docs.length > 0 && docs[0].quotationNumber) {
                const match = String(docs[0].quotationNumber).match(/(\d+)$/);
                if (match) {
                    return parseInt(match[1], 10);
                }
            }
            return 1000;
        }
    }
    catch (err) {
        // Fall back to safe default
    }
    return fallbackDefault;
}
/**
 * Atomically increments and returns the next sequential number.
 */
async function getNextSequence(key, defaultStart = 1001) {
    let existing = await exports.SequenceModel.findOne({ key });
    if (!existing) {
        const baseNumber = await resolveInitialSequence(key, defaultStart - 1);
        existing = await exports.SequenceModel.findOneAndUpdate({ key }, { $setOnInsert: { sequence: baseNumber } }, { upsert: true, new: true });
    }
    const result = await exports.SequenceModel.findOneAndUpdate({ key }, { $inc: { sequence: 1 } }, { new: true });
    return result.sequence;
}
/**
 * Peeks at the next sequential number without incrementing.
 */
async function peekNextSequence(key, defaultStart = 1001) {
    const existing = await exports.SequenceModel.findOne({ key });
    if (!existing) {
        const baseNumber = await resolveInitialSequence(key, defaultStart - 1);
        return baseNumber + 1;
    }
    return existing.sequence + 1;
}
