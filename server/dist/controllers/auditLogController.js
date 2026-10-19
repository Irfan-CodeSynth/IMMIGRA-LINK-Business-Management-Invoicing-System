"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditLogs = listAuditLogs;
const AuditLog_1 = require("../models/AuditLog");
async function listAuditLogs(req, res) {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [logs, total] = await Promise.all([
            AuditLog_1.AuditLogModel.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            AuditLog_1.AuditLogModel.countDocuments(),
        ]);
        res.json({
            success: true,
            data: {
                logs,
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
