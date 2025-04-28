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
exports.login = exports.registerTest = void 0;
const db_1 = __importDefault(require("../config/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "";
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
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            role: user.role
        }, JWT_SECRET, { expiresIn: "1d" });
        return res.status(200).json({ message: 'login success', token });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.login = login;
