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
exports.checkIdCard = exports.deleteMember = exports.updateMember = exports.createMember = exports.getMembers = void 0;
const db_1 = __importDefault(require("../config/db"));
const report_controller_1 = require("./report.controller");
const getMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";
        const companyId = req.query.companyId || "";
        const where = Object.assign(Object.assign({}, (search && {
            OR: [
                { fname: { contains: search, mode: 'insensitive' } },
                { lname: { contains: search, mode: 'insensitive' } },
                { idCard: { contains: search, mode: 'insensitive' } },
            ]
        })), (companyId && {
            companyId: parseInt(companyId)
        }));
        const [data, totalItems] = yield Promise.all([
            db_1.default.member.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    company: { select: { name: true } },
                    location: { select: { name: true } },
                    lecturer: { select: { name: true } }
                }
            }),
            db_1.default.member.count({ where })
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
exports.getMembers = getMembers;
// Create
const createMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { titleName, fname, lname, idCard, phone, companyId, locationId, lecturerId, dateOfTraining } = req.body;
        console.log(req.body);
        if (!titleName || !fname || !lname || !idCard || !phone || !companyId || !locationId || !lecturerId) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }
        // Check ซ้ำ
        const resultCheck = yield db_1.default.member.findFirst({
            where: { idCard }
        });
        if (resultCheck)
            return res.status(400).json({ message: "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่" });
        const result = yield db_1.default.member.create({
            data: {
                titleName,
                fname,
                lname,
                idCard,
                phone,
                companyId: Number(companyId),
                locationId: Number(locationId),
                lecturerId: Number(lecturerId),
                dateOfTraining
            }
        });
        res.status(201).json({ result, message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.createMember = createMember;
// Update
const updateMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { titleName, fname, lname, idCard, phone, companyId, locationId, lecturerId, dateOfTraining } = req.body;
        if (!id || !idCard)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        // Check รหัสบัตรประชาชนซ้ำ
        const existing = yield db_1.default.member.findFirst({
            where: {
                idCard: {
                    equals: idCard,
                    mode: "insensitive"
                },
                NOT: {
                    id: id
                }
            }
        });
        if (existing)
            return res.status(400).json({ message: "มีข้อมูลนี้แล้ว" });
        // ถ้ามีการแก้ไขบริษัท ถึงจะทำงาน
        const oldMember = yield db_1.default.member.findUnique({ where: { id } });
        if (!oldMember)
            return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" });
        if (companyId !== oldMember.companyId) {
            // หา company name
            const companyName = yield db_1.default.company.findUnique({ where: { id: Number(companyId) } });
            yield (0, report_controller_1.createMemberChangeCompany)({ id, oldCompanyId: oldMember.companyId, newCompany: companyName === null || companyName === void 0 ? void 0 : companyName.name });
        }
        const data = {
            titleName,
            fname,
            lname,
            idCard,
            phone,
            companyId: Number(companyId),
            locationId: Number(locationId),
            lecturerId: Number(lecturerId),
            dateOfTraining
        };
        const result = yield db_1.default.member.update({
            where: { id },
            data
        });
        return res.status(201).json({ result, message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.updateMember = updateMember;
// Delete
const deleteMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (!id)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        yield db_1.default.member.delete({ where: { id } });
        return res.status(200).json({ message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.deleteMember = deleteMember;
// Check Id Card
const checkIdCard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idCard } = req.body;
        if (!idCard)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        const result = yield db_1.default.member.findFirst({
            where: { idCard }
        });
        if (!(result === null || result === void 0 ? void 0 : result.idCard))
            return res.status(400).json({ message: "ไม่พบข้อมูล กรุณาลงทะเบียน" });
        return res.status(200).json(result === null || result === void 0 ? void 0 : result.idCard);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.checkIdCard = checkIdCard;
// member Change Company Report
