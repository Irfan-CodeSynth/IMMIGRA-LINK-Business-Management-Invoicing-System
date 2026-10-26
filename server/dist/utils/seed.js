"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const CompanySettings_1 = require("../models/CompanySettings");
const Account_1 = require("../models/Account");
const shared_1 = require("@immigra/shared");
/**
 * Initializes essential system baseline:
 * 1. Root Super Admin account (DeepX Admin - info.deepxaisol@gmail.com)
 * 2. Official Company Profile & Settings (starts at sequence #1, clean non-demo state)
 * 3. Base Chart of Accounts structure with zero balances
 *
 * NOTE: Absolutely NO demo customers, demo invoices, demo staff, or demo services are seeded.
 */
async function seedDatabase() {
    // 1. Remove all legacy/demo admin accounts
    await User_1.UserModel.deleteMany({
        email: { $ne: "info.deepxaisol@gmail.com" },
        $or: [
            {
                email: {
                    $in: [
                        "admin@immigralink.ae",
                        "waheed@immigralink.ae",
                        "accountant@immigralink.ae",
                        "consultant@immigralink.ae",
                    ],
                },
            },
            { email: /waheed/i },
            { name: /waheed/i },
            { email: /admin@immigralink/i },
        ],
    });
    // 2. Ensure DeepX Admin is the primary Super Admin
    const deepXEmail = "info.deepxaisol@gmail.com";
    const deepXPasswordHash = await bcryptjs_1.default.hash("DeepX)88##", 10);
    const existingDeepX = await User_1.UserModel.findOne({ email: deepXEmail });
    if (!existingDeepX) {
        await User_1.UserModel.create({
            name: "DeepX Admin",
            email: deepXEmail,
            passwordHash: deepXPasswordHash,
            role: shared_1.UserRole.SUPER_ADMIN,
            phone: "",
            isActive: true,
        });
        console.log("[Seeder] Created Super Admin account: DeepX Admin (info.deepxaisol@gmail.com)");
    }
    else {
        existingDeepX.name = "DeepX Admin";
        existingDeepX.passwordHash = deepXPasswordHash;
        existingDeepX.role = shared_1.UserRole.SUPER_ADMIN;
        existingDeepX.phone = "";
        existingDeepX.isActive = true;
        await existingDeepX.save();
    }
    // 2. Company Settings (Rebranded to DeepX Ai Solutions) & One-time Database Flush
    let existingSettings = await CompanySettings_1.CompanySettingsModel.findOne();
    if (!existingSettings) {
        existingSettings = await CompanySettings_1.CompanySettingsModel.create({
            companyName: "DeepX Ai Solutions",
            country: "United Arab Emirates",
            city: "Dubai",
            address: "Dubai, United Arab Emirates",
            phone: "",
            email: "info.deepxaisol@gmail.com",
            website: "www.deepxai.com",
            tradeLicenseNumber: "",
            trn: "",
            isVatRegistered: false,
            currency: "AED",
            timezone: "Asia/Dubai",
            bankDetails: {
                bankName: "",
                accountTitle: "DeepX Ai Solutions",
                accountNumber: "",
                iban: "",
            },
            invoicePrefix: "INV-",
            invoiceNextSequence: 1,
            invoiceDefaultNotes: "Thank you for choosing DeepX Ai Solutions.",
            invoicePaymentInstructions: "Please transfer payment via Bank or Cash.",
            logoUrl: "/src/assets/deepx-logo.png",
        });
    }
    else if (existingSettings.companyName !== "DeepX Ai Solutions") {
        // One-time flush of legacy Immigra Link test data
        const { InvoiceModel } = require("../models/Invoice");
        const { QuotationModel } = require("../models/Quotation");
        const { PaymentModel } = require("../models/Payment");
        const { ExpenseModel } = require("../models/Expense");
        const { CustomerModel } = require("../models/Customer");
        const { SupplierModel } = require("../models/Supplier");
        const { ServiceModel } = require("../models/Service");
        const { JournalEntryModel } = require("../models/JournalEntry");
        const { SequenceModel } = require("../models/Sequence");
        await Promise.all([
            InvoiceModel.deleteMany({}),
            QuotationModel.deleteMany({}),
            PaymentModel.deleteMany({}),
            ExpenseModel.deleteMany({}),
            CustomerModel.deleteMany({}),
            SupplierModel.deleteMany({}),
            ServiceModel.deleteMany({}),
            JournalEntryModel.deleteMany({}),
            SequenceModel.deleteMany({}),
            Account_1.AccountModel.updateMany({}, { $set: { currentBalanceFils: 0 } }),
        ]);
        existingSettings.companyName = "DeepX Ai Solutions";
        existingSettings.email = "info.deepxaisol@gmail.com";
        existingSettings.website = "www.deepxai.com";
        existingSettings.invoiceDefaultNotes = "Thank you for choosing DeepX Ai Solutions.";
        existingSettings.logoUrl = "/src/assets/deepx-logo.png";
        existingSettings.invoicePrefix = "INV-";
        existingSettings.invoiceNextSequence = 1;
        await existingSettings.save();
        console.log("[Seeder] Flushed old entries and updated company to DeepX Ai Solutions!");
    }
    // 3. Official UAE Chart of Accounts structure (all balances 0)
    for (const acc of shared_1.DEFAULT_CHART_OF_ACCOUNTS) {
        const existingAcc = await Account_1.AccountModel.findOne({ code: acc.code });
        if (!existingAcc) {
            await Account_1.AccountModel.create({
                code: acc.code,
                name: acc.name,
                type: acc.type,
                subType: acc.subType,
                currency: "AED",
                currentBalanceFils: 0,
                isSystem: acc.isSystem,
            });
        }
    }
    console.log("[Seeder] Baseline initialization complete. Zero demo data loaded.");
}
if (require.main === module) {
    const { connectDB, disconnectDB } = require("../config/db");
    connectDB()
        .then(() => seedDatabase())
        .then(async () => {
        console.log("[Seeder] Seeding finished.");
        await disconnectDB();
        process.exit(0);
    })
        .catch((err) => {
        console.error("[Seeder Error]:", err);
        process.exit(1);
    });
}
