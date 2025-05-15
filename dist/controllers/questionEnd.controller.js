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
exports.EndQuestionUpdateStatus = exports.deleteQuestionEnd = exports.updateQuestionEnd = exports.createQuestionEnd = exports.getQuestionsEnd = void 0;
const db_1 = __importDefault(require("../config/db"));
// GET ALL
const getQuestionsEnd = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";
        const where = search
            ? {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            }
            : {};
        const [data, totalItems] = yield Promise.all([
            db_1.default.questionEnd.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAT: 'desc'
                },
                include: {
                    questionEndList: {
                        orderBy: {
                            id: "asc"
                        }
                    }
                }
            }),
            db_1.default.questionEnd.count({ where })
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
exports.getQuestionsEnd = getQuestionsEnd;
// Create
const createQuestionEnd = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, questions } = req.body;
        if (!name || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
        }
        // Check ซ้ำ
        const resultCheck = yield db_1.default.questionEnd.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                }
            }
        });
        if (resultCheck)
            return res.status(400).json({ message: "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่" });
        const result = yield db_1.default.questionEnd.create({
            data: {
                name,
                questionEndList: {
                    createMany: {
                        data: questions.map((q) => {
                            var _a;
                            return ({
                                question: q.question,
                                status: (_a = q.status) !== null && _a !== void 0 ? _a : 0
                            });
                        })
                    }
                }
            },
            include: {
                questionEndList: true
            }
        });
        res.status(201).json({ result, message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.createQuestionEnd = createQuestionEnd;
// Update
const updateQuestionEnd = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const { name, questions } = req.body;
        console.log({ questions });
        if (!id)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        // // Check
        const existing = yield db_1.default.questionEnd.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                },
                NOT: {
                    id: id
                }
            }
        });
        if (existing)
            return res.status(400).json({ message: "มีข้อมูลนี้แล้ว" });
        const result = yield db_1.default.questionEnd.update({
            where: { id },
            data: { name },
        });
        const allQuestionEndList = yield db_1.default.questionEndList.findMany({
            where: { questionEndId: id },
            select: { id: true }
        });
        const incomingIds = questions.filter((q) => q.id).map((q) => q.id);
        const toDelete = allQuestionEndList.filter(eq => !incomingIds.includes(eq.id));
        yield db_1.default.questionEndList.deleteMany({
            where: {
                id: { in: toDelete.map(q => q.id) }
            }
        });
        for (const q of questions) {
            console.log(q);
            if (q.id) { // ถ้ามี ID แล้ว เป็น Update
                yield db_1.default.questionEndList.update({
                    where: { id: q.id },
                    data: {
                        question: q.question,
                        status: q.status
                    }
                });
            }
            else { // ถ้ายังไม่มี ID เป็น Create
                yield db_1.default.questionEndList.create({
                    data: {
                        question: q.question,
                        status: q.status,
                        questionEndId: id
                    }
                });
            }
        }
        return res.status(201).json({ result, message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.updateQuestionEnd = updateQuestionEnd;
// Delete
const deleteQuestionEnd = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (!id)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        yield db_1.default.questionEndList.deleteMany({
            where: { questionEndId: id }
        });
        yield db_1.default.questionEnd.delete({
            where: { id }
        });
        return res.status(200).json({ message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.deleteQuestionEnd = deleteQuestionEnd;
// User
const EndQuestionUpdateStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idCard } = req.body;
        console.log({ idCard });
        yield db_1.default.member.update({ data: { statusQuestionEnd: 1 }, where: { idCard } });
        return res.status(200).json({ message: 'success' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});
exports.EndQuestionUpdateStatus = EndQuestionUpdateStatus;
