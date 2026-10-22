import { connectDB, disconnectDB } from "../config/db";
import { UserModel } from "../models/User";
import { CustomerModel } from "../models/Customer";
import { InvoiceModel } from "../models/Invoice";
import { PaymentModel } from "../models/Payment";
import { ExpenseModel } from "../models/Expense";
import { QuotationModel } from "../models/Quotation";
import { SupplierModel } from "../models/Supplier";
import { ServiceModel } from "../models/Service";
import { JournalEntryModel } from "../models/JournalEntry";
import { AccountModel } from "../models/Account";
import { SequenceModel } from "../models/Sequence";
import { AuditLogModel } from "../models/AuditLog";
import { CompanySettingsModel } from "../models/CompanySettings";
import { UserRole } from "@immigra/shared";

export async function purgeAllDemoData(): Promise<void> {
  console.log("[Cleaner] Purging all demo data from database...");

  // 1. Delete all transactional and operational demo records
  const delInvoices = await InvoiceModel.deleteMany({});
  const delPayments = await PaymentModel.deleteMany({});
  const delExpenses = await ExpenseModel.deleteMany({});
  const delQuotations = await QuotationModel.deleteMany({});
  const delCustomers = await CustomerModel.deleteMany({});
  const delSuppliers = await SupplierModel.deleteMany({});
  const delServices = await ServiceModel.deleteMany({});
  const delJournals = await JournalEntryModel.deleteMany({});
  const delAuditLogs = await AuditLogModel.deleteMany({});

  // 2. Delete non-admin demo staff
  const delStaff = await UserModel.deleteMany({
    email: { $ne: "admin@immigralink.ae" },
  });

  // 3. Reset all account balances to 0
  await AccountModel.updateMany({}, { $set: { currentBalanceFils: 0 } });

  // 4. Reset sequences back to 1
  await SequenceModel.deleteMany({});

  // 5. Update Company Settings sequence counter and prefix to clean defaults
  await CompanySettingsModel.updateMany(
    {},
    {
      $set: {
        invoicePrefix: "INV-",
        invoiceNextSequence: 1,
      },
    }
  );

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
  connectDB()
    .then(async () => {
      await purgeAllDemoData();
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Cleaner Error]:", err);
      process.exit(1);
    });
}
