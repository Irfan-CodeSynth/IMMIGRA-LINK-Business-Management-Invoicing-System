"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
const CompanySettings_1 = require("../models/CompanySettings");
const Sequence_1 = require("../models/Sequence");
const shared_1 = require("@immigra/shared");
const AuditLog_1 = require("../models/AuditLog");
async function getSettings(req, res) {
    try {
        let settings = await CompanySettings_1.CompanySettingsModel.findOne();
        if (!settings) {
            settings = await CompanySettings_1.CompanySettingsModel.create({});
        }
        const currentNext = await (0, Sequence_1.peekNextSequence)("INVOICE_SEQUENCE", 1);
        const settingsObj = settings.toObject();
        settingsObj.invoiceNextSequence = currentNext;
        res.json({ success: true, data: settingsObj });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
async function updateSettings(req, res) {
    try {
        const parsed = shared_1.SettingsUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ success: false, errors: parsed.error.flatten() });
            return;
        }
        let settings = await CompanySettings_1.CompanySettingsModel.findOne();
        if (!settings) {
            settings = await CompanySettings_1.CompanySettingsModel.create(parsed.data);
        }
        else {
            Object.assign(settings, parsed.data);
            await settings.save();
        }
        // Synchronize sequence number if user customized next number
        if (typeof parsed.data.invoiceNextSequence === "number") {
            const nextNum = Math.max(1, parsed.data.invoiceNextSequence);
            await Sequence_1.SequenceModel.findOneAndUpdate({ key: "INVOICE_SEQUENCE" }, { sequence: nextNum - 1 }, { upsert: true });
        }
        if (req.user) {
            await AuditLog_1.AuditLogModel.create({
                userId: req.user.userId,
                userName: req.user.name,
                action: "UPDATE_SETTINGS",
                entityType: "SETTINGS",
                details: { companyName: settings.companyName },
            });
        }
        const currentNext = await (0, Sequence_1.peekNextSequence)("INVOICE_SEQUENCE", 1);
        const settingsObj = settings.toObject();
        settingsObj.invoiceNextSequence = currentNext;
        res.json({ success: true, data: settingsObj });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
