import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";
import { CompanySettingsModel } from "../models/CompanySettings";
import { AccountModel } from "../models/Account";
import { UserRole, DEFAULT_CHART_OF_ACCOUNTS } from "@immigra/shared";

/**
 * Initializes essential system baseline:
 * 1. Root Super Admin account (admin@immigralink.ae)
 * 2. Official Company Profile & Settings (starts at sequence #1, clean non-demo state)
 * 3. Base Chart of Accounts structure with zero balances
 *
 * NOTE: Absolutely NO demo customers, demo invoices, demo staff, or demo services are seeded.
 */
export async function seedDatabase(): Promise<void> {
  // Check if admin already exists
  const existingAdmin = await UserModel.findOne({ email: "admin@immigralink.ae" });
  if (existingAdmin) {
    return;
  }

  console.log("[Seeder] Initializing clean baseline for IMMIGRA LINK BUSINESS SERVICES...");

  // 1. Root Super Admin
  const passwordHash = await bcrypt.hash("admin123", 10);
  await UserModel.create({
    name: "System Administrator",
    email: "admin@immigralink.ae",
    passwordHash,
    role: UserRole.SUPER_ADMIN,
    phone: "+971 50 585 6318",
    isActive: true,
  });

  // 2. Company Settings (Clean baseline)
  const existingSettings = await CompanySettingsModel.findOne();
  if (!existingSettings) {
    await CompanySettingsModel.create({
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
        bankName: "",
        accountTitle: "",
        accountNumber: "",
        iban: "",
      },
      invoicePrefix: "INV-",
      invoiceNextSequence: 1,
      invoiceDefaultNotes: "Thank you for choosing Immigra Link Business Services.",
      invoicePaymentInstructions: "Please transfer payment via Bank or Cash.",
      logoUrl: "/uploads/immigra-logo.jpg",
    });
  }

  // 3. Official UAE Chart of Accounts structure (all balances 0)
  for (const acc of DEFAULT_CHART_OF_ACCOUNTS) {
    const existingAcc = await AccountModel.findOne({ code: acc.code });
    if (!existingAcc) {
      await AccountModel.create({
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
    .catch((err: any) => {
      console.error("[Seeder Error]:", err);
      process.exit(1);
    });
}
