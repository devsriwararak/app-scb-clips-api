"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshTokene = exports.login = exports.registerTest = void 0;
const db_1 = __importDefault(require("../config/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const tools_1 = require("../utils/tools");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const generateAccessToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: "2m" });
};
const generateRefreshToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};
const registerTest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, username, password, role } = req.body;
        const checkUser = yield db_1.default.user.findUnique({ where: { username } });
        if (checkUser)
            return res.status(400).json({ message: 'มี Username นี้แล้ว !' });
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield db_1.default.user.create({
            data: {
                name,
                username,
                password: hashedPassword,
                role: role || "USER"
            }
        });
        res.status(201).json({ message: "สร้างสำเร็จ", user });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.registerTest = registerTest;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const user = yield db_1.default.user.findUnique({ where: { username } });
        if (!user)
            return res.status(400).json({ message: "ไม่พบผู้ใช้งาน" });
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid)
            return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id, user.role);
        // บันทึก refresh token
        yield db_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 วัน
            }
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && req.hostname !== 'localhost' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        yield (0, tools_1.checkExpiredCertificates)();
        return res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            accessToken
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.login = login;
const refreshTokene = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.refreshToken;
    if (!token)
        return res.status(401).json({ message: "ไม่พบ refresh token" });
    const storedToken = yield db_1.default.refreshToken.findUnique({ where: { token } });
    if (!storedToken)
        return res.status(403).json({ message: "refresh token ไม่ถูกต้อง" });
    try {
        //ลบ token เก่า
        const payload = jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
        yield db_1.default.refreshToken.delete({ where: { token } });
        //สร้าง refresh token ใหม่
        const newRefreshToken = generateRefreshToken(payload.userId, payload.role);
        yield db_1.default.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: payload.userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
        });
        const accessToken = generateAccessToken(payload.userId, payload.role);
        // set cookie ใหม่
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && req.hostname !== 'localhost' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({ accessToken });
    }
    catch (error) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && req.hostname !== 'localhost' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        });
        return res.status(403).json({ message: "Refresh token หมดอายุ หรือไม่ถูกต้อง" });
    }
});
exports.refreshTokene = refreshTokene;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return res.status(400).json({ message: "ไม่พบ refresh token" });
        // ลบ refresh token ออกจาก database
        yield db_1.default.refreshToken.deleteMany({
            where: { token: refreshToken }
        });
        // clear cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && req.hostname !== 'localhost' ? true : false,
            sameSite: 'strict',
        });
        return res.status(200).json({ message: "Logout success" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.logout = logout;
