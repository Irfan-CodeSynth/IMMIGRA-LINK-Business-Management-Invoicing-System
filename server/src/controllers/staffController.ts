import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { UserModel } from "../models/User";
import { UserCreateSchema, UserRole } from "@immigra/shared";
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

export async function deleteStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: "Staff user not found" });
      return;
    }

    // Safety checks
    if (req.user && req.user.userId === user._id.toString()) {
      res.status(400).json({ success: false, message: "You cannot delete your own logged-in account" });
      return;
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      const superAdminCount = await UserModel.countDocuments({ role: UserRole.SUPER_ADMIN });
      if (superAdminCount <= 1) {
        res.status(400).json({ success: false, message: "Cannot delete the sole Super Admin account in the system" });
        return;
      }
    }

    await UserModel.findByIdAndDelete(user._id);

    if (req.user) {
      await AuditLogModel.create({
        userId: req.user.userId,
        userName: req.user.name,
        action: "DELETE_STAFF",
        entityType: "USER",
        entityId: user._id.toString(),
        details: { email: user.email, name: user.name, role: user.role },
      });
    }

    res.json({ success: true, message: `Staff user "${user.name}" (${user.email}) deleted successfully`, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
