import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { AuditLogModel } from "../models/AuditLog";

export async function listAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLogModel.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLogModel.countDocuments(),
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
