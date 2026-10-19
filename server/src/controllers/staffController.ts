import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { UserModel } from "../models/User";
import { UserCreateSchema } from "@immigra/shared";
import { AuditLogModel } from "../models/AuditLog";

export async function listStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const users = await UserModel.find().select("-passwordHash").sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parsed = UserCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const { email, password, name, role, phone } = parsed.data;
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: "A staff member with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phone,
      isActive: true,
    });

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "CREATE_STAFF",
        entityType: "USER",
        entityId: user._id.toString(),
        details: { email: user.email, role: user.role },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleStaffStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: "Staff user not found" });
      return;
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
