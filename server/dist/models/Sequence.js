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
    sequence: { type: Number, required: true, default: 0 },
});
exports.SequenceModel = mongoose_1.default.model("Sequence", SequenceSchema);
/**
 * Format a sequence number with 3-digit padding:
 * 1 -> "001" (e.g. INV-001)
 * 2 -> "002" (e.g. INV-002)
 * 3 -> "003" (e.g. INV-003)
 * 1000 -> "1000"
 */
function formatSequence(seq, minPadding = 3) {
    if (seq < 1000) {
        return String(seq).padStart(minPadding, "0");
    }
    return String(seq);
}
/**
 * Atomically increments and returns the next sequential number starting from 1.
 */
async function getNextSequence(key, defaultStart = 1) {
    const baseDefault = Math.max(0, defaultStart - 1);
    await exports.SequenceModel.findOneAndUpdate({ key }, { $setOnInsert: { sequence: baseDefault } }, { upsert: true, new: true });
    const result = await exports.SequenceModel.findOneAndUpdate({ key }, { $inc: { sequence: 1 } }, { new: true });
    return result.sequence;
}
/**
 * Peeks at the next sequential number without incrementing (default start: 1).
 */
async function peekNextSequence(key, defaultStart = 1) {
    const existing = await exports.SequenceModel.findOne({ key });
    if (!existing) {
        return defaultStart;
    }
    return existing.sequence + 1;
}
