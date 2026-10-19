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
exports.CustomerModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const shared_1 = require("@immigra/shared");
const CustomerSchema = new mongoose_1.Schema({
    customerType: {
        type: String,
        enum: Object.values(shared_1.CustomerType),
        default: shared_1.CustomerType.INDIVIDUAL,
        required: true,
    },
    referenceNumber: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true, trim: true, index: true },
    companyName: { type: String, trim: true, index: true },
    contactPerson: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    whatsapp: { type: String, trim: true },
    nationality: { type: String, trim: true },
    address: {
        street: { type: String },
        city: { type: String, default: "Dubai" },
        emirate: { type: String, default: "Dubai" },
        poBox: { type: String },
    },
    tradeLicenseNumber: { type: String, trim: true },
    trn: { type: String, trim: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    balanceFils: { type: Number, default: 0 },
    documents: [
        {
            fileName: { type: String, required: true },
            fileUrl: { type: String, required: true },
            fileType: { type: String, required: true },
            fileSize: { type: Number },
            uploadedAt: { type: Date, default: Date.now },
        },
    ],
}, { timestamps: true });
CustomerSchema.index({
    displayName: "text",
    companyName: "text",
    phone: "text",
    email: "text",
    referenceNumber: "text",
});
exports.CustomerModel = mongoose_1.default.model("Customer", CustomerSchema);
