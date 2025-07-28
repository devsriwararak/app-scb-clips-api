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
exports.deleteCompany = exports.updateCompany = exports.createCompany = exports.getCompanys = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET ALL
const getCompanys = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const search = req.query.search || "";
        const where = search
            ? {
                name: {
                    contains: search,
                    // mode: 'insensitive',
                },
            }
            : {};
        const [data, totalItems] = yield Promise.all([
            db_1.default.company.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAT: 'desc'
                }
            }),
            db_1.default.company.count({ where })
        ]);
        const result = {
            data,
            pagination: {
                page,
                totalPage: Math.ceil(totalItems / limit),
                totalItems
            }
        };
        return res.status(200).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.getCompanys = getCompanys;
// Create
const createCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        console.log(name);
        // Check ซ้ำ
        const resultCheck = yield db_1.default.company.findFirst({
            where: { name: {
                    equals: name,
                    // mode: "insensitive"
                } }
        });
        if (resultCheck)
            return res.status(400).json({ message: "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่" });
        const result = yield db_1.default.company.create({ data: { name } });
        res.status(201).json({ result, message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.createCompany = createCompany;
// Update
const updateCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Decoded Token:', req.auth);
        const id = parseInt(req.params.id);
        const { name } = req.body;
        if (!id || !name)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        // Check
        const existingCompany = yield db_1.default.company.findFirst({
            where: {
                name: {
                    equals: name,
                    // mode: "insensitive"
                },
                NOT: {
                    id: id
                }
            }
        });
        if (existingCompany)
            return res.status(400).json({ message: "มีข้อมูลนี้แล้ว" });
        const result = yield db_1.default.company.update({
            where: { id },
            data: { name }
        });
        return res.status(201).json({ result, message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.updateCompany = updateCompany;
// Delete
const deleteCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (!id)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        yield db_1.default.company.delete({ where: { id } });
        return res.status(200).json({ message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.deleteCompany = deleteCompany;
