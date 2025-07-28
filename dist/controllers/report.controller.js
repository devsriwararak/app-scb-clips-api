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
exports.deleteChangeCompany = exports.getMemberChageCompany = exports.createMemberChangeCompany = void 0;
const db_1 = __importDefault(require("../config/db"));
// Create
const createMemberChangeCompany = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!data.id || data.oldCompanyId === undefined || data.oldCompanyId === null)
            throw new Error('ส่งข้อมูลไม่ครบ');
        yield db_1.default.memberChangeCompany.create({
            data: {
                memberId: data.id,
                oldCompanyId: Number(data.oldCompanyId),
                createdAt: new Date(),
                newCompany: data.newCompany || ""
            }
        });
        return true;
    }
    catch (error) {
        console.error(error);
        return false;
    }
});
exports.createMemberChangeCompany = createMemberChangeCompany;
const getMemberChageCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const search = req.query.search || "";
        const companyId = req.query.companyId || "";
        const where = Object.assign(Object.assign({}, (search && {
            OR: [
                {
                    member: {
                        OR: [
                            { fname: { contains: search } },
                            { lname: { contains: search } }
                        ]
                    }
                }
            ]
        })), (companyId && {
            oldCompanyId: parseInt(companyId)
        }));
        const [data, totalItems] = yield Promise.all([
            db_1.default.memberChangeCompany.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    member: {
                        include: {
                            company: { select: { name: true } },
                            location: { select: { name: true } },
                            lecturer: { select: { name: true } }
                        }
                    },
                    company: { select: { name: true } },
                }
            }),
            db_1.default.memberChangeCompany.count({ where })
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
exports.getMemberChageCompany = getMemberChageCompany;
const deleteChangeCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (!id)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        yield db_1.default.memberChangeCompany.delete({ where: { id } });
        return res.status(200).json({ message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.deleteChangeCompany = deleteChangeCompany;
