"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
const jwt_1 = require("../config/jwt");
function authMiddleware(req, res, next) {
    // Check cookie or Bearer header
    let token = req.cookies?.[jwt_1.COOKIE_NAME];
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
    }
    const payload = (0, jwt_1.verifyToken)(token);
    if (!payload) {
        res.status(401).json({ success: false, message: "Invalid or expired session" });
        return;
    }
    req.user = payload;
    next();
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: role '${req.user.role}' lacks sufficient permissions`,
            });
            return;
        }
        next();
    };
}
