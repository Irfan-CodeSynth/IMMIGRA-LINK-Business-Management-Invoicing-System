import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { CompanySettingsModel } from "../models/CompanySettings";
import { SequenceModel, peekNextSequence } from "../models/Sequence";
import { SettingsUpdateSchema } from "@immigra/shared";
import { AuditLogModel } from "../models/AuditLog";

export async function getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    let settings = await CompanySettingsModel.findOne();
    if (!settings) {
      settings = await CompanySettingsModel.create({});
    }
    const currentNext = await peekNextSequence("INVOICE_SEQUENCE", 1);
    const settingsObj = settings.toObject();
    settingsObj.invoiceNextSequence = currentNext;
    res.json({ success: true, data: settingsObj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = SettingsUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    let settings = await CompanySettingsModel.findOne();
    if (!settings) {
      settings = await CompanySettingsModel.create(parsed.data);
    } else {
      Object.assign(settings, parsed.data);
      await settings.save();
    }

    // Synchronize sequence number if user customized next number
    if (typeof parsed.data.invoiceNextSequence === "number") {
      const nextNum = Math.max(1, parsed.data.invoiceNextSequence);
      await SequenceModel.findOneAndUpdate(
        { key: "INVOICE_SEQUENCE" },
        { sequence: nextNum - 1 },
        { upsert: true }
      );
    }

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "UPDATE_SETTINGS",
        entityType: "SETTINGS",
        details: { companyName: settings.companyName },
      });
    }

    const currentNext = await peekNextSequence("INVOICE_SEQUENCE", 1);
    const settingsObj = settings.toObject();
    settingsObj.invoiceNextSequence = currentNext;
    res.json({ success: true, data: settingsObj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
