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
const Service_1 = require("../models/Service");
const Customer_1 = require("../models/Customer");
const Invoice_1 = require("../models/Invoice");
const Payment_1 = require("../models/Payment");
const financialService_1 = require("../services/financialService");
const shared_1 = require("@immigra/shared");
const crypto_1 = __importDefault(require("crypto"));
async function seedDatabase() {
    // Check if admin exists
    const existingAdmin = await User_1.UserModel.findOne({ email: "admin@immigralink.ae" });
    if (existingAdmin) {
        return;
    }
    console.log("[Seeder] Initializing database with official Immigra Link records...");
    // 1. Super Admin & Staff
    const passwordHash = await bcryptjs_1.default.hash("admin123", 10);
    const admin = await User_1.UserModel.create({
        name: "Admin",
        email: "admin@immigralink.ae",
        passwordHash,
        role: shared_1.UserRole.SUPER_ADMIN,
        phone: "+971 50 585 6318",
        isActive: true,
    });
    await User_1.UserModel.create([
        {
            name: "Tariq Accountant",
            email: "accountant@immigralink.ae",
            passwordHash,
            role: shared_1.UserRole.ACCOUNTANT,
            phone: "+971 55 123 9876",
            isActive: true,
        },
        {
            name: "Sara Consultant",
            email: "consultant@immigralink.ae",
            passwordHash,
            role: shared_1.UserRole.SALES,
            phone: "+971 52 456 7890",
            isActive: true,
        },
    ]);
    // 2. Company Settings
    await CompanySettings_1.CompanySettingsModel.create({
        companyName: "IMMIGRA LINK BUSINESS SERVICES",
        country: "United Arab Emirates",
        city: "Dubai",
        address: "Al Garhoud, Dubai, United Arab Emirates",
        phone: "+971 50 585 6318",
        email: "info@immigralink.ae",
        website: "www.immigralink.ae",
        tradeLicenseNumber: "CN-1094829",
        trn: "",
        isVatRegistered: false,
        currency: "AED",
        timezone: "Asia/Dubai",
        bankDetails: {
            bankName: "Emirates NBD",
            accountTitle: "IMMIGRA LINK BUSINESS SERVICES",
            accountNumber: "1019283746501",
            iban: "AE3402600001019283746501",
            swiftCode: "EBIBAEAD",
            branch: "Deira Main Branch, Dubai",
        },
        invoicePrefix: "INV/MAIN/",
        invoiceNextSequence: 1166,
        invoiceDefaultNotes: "Thank you for trusting Immigra Link Business Services. For questions regarding this invoice, contact info@immigralink.ae.",
        invoicePaymentInstructions: "Please transfer payment to Emirates NBD (IBAN: AE3402600001019283746501) with invoice # reference.",
        logoUrl: "/uploads/immigra-logo.jpg",
    });
    // 3. Chart of Accounts
    for (const acc of shared_1.DEFAULT_CHART_OF_ACCOUNTS) {
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
    // 4. Standard UAE Services Catalog
    const servicesData = [
        { name: "Inside Entry Permit", code: "SRV-VISA-01", category: "Visa Services", defaultRateAed: 1160, costAed: 1000, revenueAccountCode: "4020" },
        { name: "Change Status", code: "SRV-VISA-02", category: "Visa Services", defaultRateAed: 700, costAed: 600, revenueAccountCode: "4020" },
        { name: "Labour Payment", code: "SRV-MOHRE-01", category: "Labour and MOHRE Services", defaultRateAed: 1280, costAed: 1200, revenueAccountCode: "4010" },
        { name: "Offer Letter - Unskilled", code: "SRV-MOHRE-02", category: "Labour and MOHRE Services", defaultRateAed: 180, costAed: 100, revenueAccountCode: "4010" },
        { name: "MOHRE Insurance", code: "SRV-MOHRE-03", category: "Labour and MOHRE Services", defaultRateAed: 189, costAed: 150, revenueAccountCode: "4010" },
        { name: "Labour Absconding", code: "SRV-MOHRE-04", category: "Labour and MOHRE Services", defaultRateAed: 80, costAed: 50, revenueAccountCode: "4010" },
        { name: "Quota Apply", code: "SRV-MOHRE-05", category: "Labour and MOHRE Services", defaultRateAed: 80, costAed: 50, revenueAccountCode: "4010" },
        { name: "Golden Visa Consultancy", code: "SRV-VISA-03", category: "Visa Services", defaultRateAed: 2500, costAed: 500, revenueAccountCode: "4020" },
        { name: "Trade License Renewal & Clearing", code: "SRV-SETUP-01", category: "Business Setup", defaultRateAed: 1500, costAed: 300, revenueAccountCode: "4030" },
        { name: "RTA Approval & Passing Assistance", code: "SRV-RTA-01", category: "RTA Services", defaultRateAed: 450, costAed: 100, revenueAccountCode: "4040" },
    ];
    for (const s of servicesData) {
        await Service_1.ServiceModel.create({
            name: s.name,
            code: s.code,
            category: s.category,
            defaultRateFils: (0, shared_1.aedToFils)(s.defaultRateAed),
            costFils: (0, shared_1.aedToFils)(s.costAed),
            revenueAccountCode: s.revenueAccountCode,
            isActive: true,
        });
    }
    // 5. Customers (including Omeza from reference invoice)
    const omezaCustomer = await Customer_1.CustomerModel.create({
        customerType: shared_1.CustomerType.BUSINESS,
        referenceNumber: "CUST-1001",
        displayName: "OMEZA QUICKCARE SERVICES EST.",
        companyName: "OMEZA QUICKCARE SERVICES EST.",
        contactPerson: "Manager",
        phone: "0562420614",
        email: "omeza.services@gmail.com",
        address: {
            street: "Al Rigga, Deira",
            city: "Dubai",
            emirate: "Dubai",
            poBox: "44910",
        },
        isActive: true,
        balanceFils: 0,
    });
    const leneiCustomer = await Customer_1.CustomerModel.create({
        customerType: shared_1.CustomerType.INDIVIDUAL,
        referenceNumber: "CUST-1002",
        displayName: "LENEI FABRIGAS",
        phone: "0501234567",
        email: "lenei.fabrigas@gmail.com",
        nationality: "Philippines",
        address: { city: "Dubai", emirate: "Dubai" },
        isActive: true,
        balanceFils: 0,
    });
    // 6. Create reference invoice INV/MAIN/1165 (matching user's reference document!)
    const items = [
        { serviceName: "Old balance", description: "OMEZA", quantity: 1, unitRateFils: (0, shared_1.aedToFils)(4188.91), discountFils: 0, lineTotalFils: (0, shared_1.aedToFils)(4188.91) },
        { serviceName: "Labour Absconding", description: "LOVELY", quantity: 1, unitRateFils: (0, shared_1.aedToFils)(80.00), discountFils: 0, lineTotalFils: (0, shared_1.aedToFils)(80.00) },
        { serviceName: "Quota Apply", description: "OMEZA", quantity: 1, unitRateFils: (0, shared_1.aedToFils)(80.00), discountFils: 0, lineTotalFils: (0, shared_1.aedToFils)(80.00) },
        { serviceName: "Offer Letter-unskill", description: "LENEI FABRIGAS", quantity: 1, unitRateFils: (0, shared_1.aedToFils)(180.00), discountFils: 0, lineTotalFils: (0, shared_1.aedToFils)(180.00) },
        { serviceName: "Mohre Insurence", description: "LENEI FABRIGAS", quantity: 1, unitRateFils: (0, shared_1.aedToFils)(189.00), discountFils: 0, lineTotalFils: (0, shared_1.aedToFils)(189.00) },
        { serviceName: "Labour Payment", description: "LENEI FABRIGAS", quantity: 1, unitRateFils: (0, shared_1.aedToFils)(1280.00), discountFils: 0, lineTotalFils: (0, shared_1.aedToFils)(1280.00) },
        { serviceName: "Inside Entry Permit", description: "LENEI FABRIGAS", quantity: 1, unitRateFils: (0, shared_1.aedToFils)(1160.00), discountFils: 0, lineTotalFils: (0, shared_1.aedToFils)(1160.00) },
        { serviceName: "Change Status", description: "LENEI FABRIGAS", quantity: 1, unitRateFils: (0, shared_1.aedToFils)(700.00), discountFils: 0, lineTotalFils: (0, shared_1.aedToFils)(700.00) },
    ];
    const grandTotalFils = (0, shared_1.aedToFils)(7857.91);
    const paidAmountFils = (0, shared_1.aedToFils)(3000.00);
    const dueAmountFils = grandTotalFils - paidAmountFils;
    const qrVerificationHash = "ref1165" + crypto_1.default.randomBytes(8).toString("hex");
    const invoice = await Invoice_1.InvoiceModel.create({
        invoiceNumber: "INV/MAIN/1165",
        sequenceNumber: 1165,
        customerId: omezaCustomer._id,
        customerSnapshot: {
            displayName: "OMEZA QUICKCARE SERVICES EST.",
            companyName: "OMEZA QUICKCARE SERVICES EST.",
            phone: "0562420614",
            email: "omeza.services@gmail.com",
            address: "Al Rigga, Deira, Dubai",
        },
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: shared_1.InvoiceStatus.PARTIALLY_PAID,
        subtotalFils: grandTotalFils,
        discountFils: 0,
        taxFils: 0,
        grandTotalFils,
        paidAmountFils,
        dueAmountFils,
        items,
        amountInWords: (0, shared_1.numberToAedWords)(grandTotalFils, true),
        barcodeData: "INV/MAIN/1165",
        qrVerificationHash,
        notes: "Official invoice from Immigra Link Business Services.",
        paymentTerms: "Payable within 14 days of issue via Cash or Emirates NBD Bank Transfer.",
        createdById: admin._id,
        creatorName: "Admin",
    });
    // Post invoice journal
    const invoiceJournalId = await financialService_1.FinancialService.postInvoiceJournal(invoice, admin._id.toString());
    invoice.journalEntryId = invoiceJournalId;
    await invoice.save();
    // Create payment record for the 3,000 AED paid
    const payment = await Payment_1.PaymentModel.create({
        receiptNumber: "REC/2026/1001",
        customerId: omezaCustomer._id,
        customerName: omezaCustomer.displayName,
        paymentDate: new Date(),
        amountFils: paidAmountFils,
        paymentMethod: "CASH",
        depositAccountCode: "1010",
        allocations: [
            {
                invoiceId: invoice._id,
                invoiceNumber: "INV/MAIN/1165",
                allocatedAmountFils: paidAmountFils,
            },
        ],
        unallocatedBalanceFils: 0,
        notes: "Partial payment received at counter",
        createdById: admin._id,
    });
    const paymentJournalId = await financialService_1.FinancialService.postPaymentJournal(payment, admin._id.toString());
    payment.journalEntryId = paymentJournalId;
    await payment.save();
    console.log("[Seeder] Successfully seeded initial admin, accounts, services, customers, reference invoice INV/MAIN/1165 and payment!");
}
if (require.main === module) {
    const { connectDB, disconnectDB } = require("../config/db");
    connectDB()
        .then(() => seedDatabase())
        .then(() => {
        console.log("[Seeder] Database seeding complete.");
        process.exit(0);
    })
        .catch((err) => {
        console.error("[Seeder] Error seeding database:", err);
        process.exit(1);
    });
}
