"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeAllDemoData = purgeAllDemoData;
const db_1 = require("../config/db");
const User_1 = require("../models/User");
const Customer_1 = require("../models/Customer");
const Invoice_1 = require("../models/Invoice");
const Payment_1 = require("../models/Payment");
const Expense_1 = require("../models/Expense");
const Quotation_1 = require("../models/Quotation");
const Supplier_1 = require("../models/Supplier");
const Service_1 = require("../models/Service");
const JournalEntry_1 = require("../models/JournalEntry");
const Account_1 = require("../models/Account");
const Sequence_1 = require("../models/Sequence");
const AuditLog_1 = require("../models/AuditLog");
const CompanySettings_1 = require("../models/CompanySettings");
async function purgeAllDemoData() {
    console.log("[Cleaner] Purging all demo data from database...");
    // 1. Delete all transactional and operational demo records
    const delInvoices = await Invoice_1.InvoiceModel.deleteMany({});
    const delPayments = await Payment_1.PaymentModel.deleteMany({});
    const delExpenses = await Expense_1.ExpenseModel.deleteMany({});
    const delQuotations = await Quotation_1.QuotationModel.deleteMany({});
    const delCustomers = await Customer_1.CustomerModel.deleteMany({});
    const delSuppliers = await Supplier_1.SupplierModel.deleteMany({});
    const delServices = await Service_1.ServiceModel.deleteMany({});
    const delJournals = await JournalEntry_1.JournalEntryModel.deleteMany({});
    const delAuditLogs = await AuditLog_1.AuditLogModel.deleteMany({});
    // 2. Delete non-admin demo staff
    const delStaff = await User_1.UserModel.deleteMany({
        email: { $ne: "info.deepxaisol@gmail.com" },
    });
    // 3. Reset all account balances to 0
    await Account_1.AccountModel.updateMany({}, { $set: { currentBalanceFils: 0 } });
    // 4. Reset sequences back to 1
    await Sequence_1.SequenceModel.deleteMany({});
    // 5. Update Company Settings sequence counter and prefix to clean defaults
    await CompanySettings_1.CompanySettingsModel.updateMany({}, {
        $set: {
            invoicePrefix: "INV-",
            invoiceNextSequence: 1,
        },
    });
    console.log("[Cleaner] Purge summary:");
    console.log(`- Invoices deleted: ${delInvoices.deletedCount}`);
    console.log(`- Payments deleted: ${delPayments.deletedCount}`);
    console.log(`- Expenses deleted: ${delExpenses.deletedCount}`);
    console.log(`- Quotations deleted: ${delQuotations.deletedCount}`);
    console.log(`- Customers deleted: ${delCustomers.deletedCount}`);
    console.log(`- Suppliers deleted: ${delSuppliers.deletedCount}`);
    console.log(`- Services deleted: ${delServices.deletedCount}`);
    console.log(`- Journal Entries deleted: ${delJournals.deletedCount}`);
    console.log(`- Audit Logs deleted: ${delAuditLogs.deletedCount}`);
    console.log(`- Demo Staff deleted: ${delStaff.deletedCount}`);
    console.log("- Sequences reset to initial clean state.");
    console.log("- Chart of Accounts balances reset to 0.");
    console.log("[Cleaner] Complete. Application database is 100% clean.");
}
if (require.main === module) {
    (0, db_1.connectDB)()
        .then(async () => {
        await purgeAllDemoData();
        await (0, db_1.disconnectDB)();
        process.exit(0);
    })
        .catch((err) => {
        console.error("[Cleaner Error]:", err);
        process.exit(1);
    });
}
