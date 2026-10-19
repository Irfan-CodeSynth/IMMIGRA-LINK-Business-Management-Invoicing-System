import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserModel } from "../models/User";
import { signToken, setAuthCookie, clearAuthCookie } from "../config/jwt";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { LoginSchema } from "@immigra/shared";
import { AuditLogModel } from "../models/AuditLog";

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten() });
      return;
    }

    const { email, password } = parsed.data;
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: "Invalid email or inactive account" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    setAuthCookie(res, token);

    await AuditLogModel.create({
      userId: user._id,
      userName: user.name,
      action: "LOGIN",
      entityType: "AUTH",
      details: { email: user.email },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  clearAuthCookie(res);
  if (req.user) {
    await AuditLogModel.create({
      userId: req.user.userId,
      userName: req.user.name,
      action: "LOGOUT",
      entityType: "AUTH",
      ipAddress: req.ip,
    });
  }
  res.json({ success: true, message: "Logged out successfully" });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const user = await UserModel.findById(req.user.userId).select("-passwordHash");
  if (!user || !user.isActive) {
    res.status(401).json({ success: false, message: "Account not found or inactive" });
    return;
  }

  res.json({ success: true, data: user });
}
