"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const isAdmin = (req, res, next) => {
    var _a;
    const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    if (role !== "ADMIN") {
        res.status(403).json({ message: 'สำหรับผู้ดูแลระบบเท่านั้น (Admin Only)' });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
