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
exports.test = exports.memberUpdateDateOfTraining = exports.getImageMember = exports.certificateEnd = exports.certificatePDFSend = exports.certificatePDF = exports.updateVerify = exports.checkIdCard = exports.deleteMember = exports.updateMember = exports.createMember = exports.getMembers = void 0;
const db_1 = __importDefault(require("../config/db"));
const report_controller_1 = require("./report.controller");
const tools_1 = require("../utils/tools");
const nodemailer_1 = __importDefault(require("nodemailer"));
const date_fns_1 = require("date-fns");
const moment_1 = __importDefault(require("moment"));
const ftpClient_1 = require("../config/ftpClient");
const mail_service_1 = require("../utils/mail.service");
require('isomorphic-fetch');
const getMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const search = req.query.search || "";
        const companyId = req.query.companyId || "";
        const filter = req.query.filter || "";
        const terms = (search === null || search === void 0 ? void 0 : search.split(/\s+/).filter(Boolean)) || [];
        console.log({ filter });
        const where = Object.assign(Object.assign({}, (terms.length > 0 && {
            AND: terms.map(item => ({
                OR: [
                    { titleName: { contains: item } },
                    { fname: { contains: item } },
                    { lname: { contains: item } },
                    { idCard: { contains: item } },
                ]
            }))
        })), (companyId && {
            companyId: parseInt(companyId)
        }));
        const [data, totalItems] = yield Promise.all([
            db_1.default.member.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: filter === 'asc' ? 'asc' : 'desc'
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
        const { titleName, fname, lname, idCard, phone, companyId, locationId, lecturerId, dateOfTraining, email } = req.body;
        const imageFile = req.file;
        if (!imageFile) {
            return res.status(400).json({ message: 'Image is required.' });
        }
        if (!titleName || !fname || !lname || !idCard || !phone || !companyId || !locationId || !lecturerId) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }
        // Check ซ้ำ
        const resultCheck = yield db_1.default.member.findFirst({
            where: { idCard }
        });
        if (resultCheck)
            return res.status(400).json({ message: "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่" });
        const imageUrl = yield (0, tools_1.uploadFileToFtp)(imageFile);
        const result = yield db_1.default.member.create({
            data: {
                titleName,
                fname,
                lname,
                idCard,
                phone,
                email,
                image: imageUrl || "",
                companyId: Number(companyId),
                locationId: Number(locationId),
                lecturerId: Number(lecturerId),
                dateOfTraining
            }
        });
        const idCardEncrypt = yield (0, tools_1.encrypt)(idCard);
        res.status(201).json({ result, message: "ทำรายการสำเร็จ", idCard: idCardEncrypt });
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
        const { titleName, fname, lname, idCard, idCardType, phone, companyId, locationId, lecturerId, dateOfTraining, email } = req.body;
        const imageFile = req.file;
        if (!id || !idCard)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        // Check รหัสบัตรประชาชนซ้ำ
        const existing = yield db_1.default.member.findFirst({
            where: {
                idCard: {
                    equals: idCard,
                    // mode: "insensitive"
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
        // หารูปเก่า กรณีจะเปลี่ยนรูป
        let newInmagePath = "";
        const searchOldImage = yield db_1.default.member.findFirst({ where: { id }, select: { image: true } });
        const oldImage = String(searchOldImage === null || searchOldImage === void 0 ? void 0 : searchOldImage.image);
        if (imageFile) {
            // await deleteImageFtp(String(oldImage))
            newInmagePath = yield (0, tools_1.uploadFileToFtp)(imageFile, oldImage);
        }
        const data = {
            titleName,
            fname,
            lname,
            idCard,
            idCardType,
            phone,
            email,
            image: imageFile ? newInmagePath : oldImage,
            companyId: Number(companyId),
            locationId: Number(locationId),
            lecturerId: Number(lecturerId),
            dateOfTraining: dateOfTraining || null
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
        const result = yield db_1.default.member.findFirst({
            where: { id },
            select: { image: true }
        });
        const image = result === null || result === void 0 ? void 0 : result.image;
        if (image)
            yield (0, tools_1.deleteImageFtp)(image);
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
        let statusEncrypt = false;
        const idCardLength = idCard.length;
        let useIdCard = idCard;
        console.log('idCardLength :', idCardLength);
        if (!idCard)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        if (idCardLength > 13)
            statusEncrypt = true;
        if (statusEncrypt === true) {
            const decipher = yield (0, tools_1.decrypt)(idCard);
            useIdCard = decipher;
        }
        const result = yield db_1.default.member.findFirst({
            where: {
                idCard: useIdCard,
                verify: 1
            },
            include: {
                location: { select: { name: true } }
            }
        });
        if (!(result === null || result === void 0 ? void 0 : result.idCard))
            return res.status(400).json({ message: "ไม่พบข้อมูล กรุณาลงทะเบียน" });
        if (statusEncrypt == false) {
            const encrypted = yield (0, tools_1.encrypt)(result.idCard);
            useIdCard = encrypted;
        }
        const data = {
            idCard: useIdCard,
            dateOfTraining: result.dateOfTraining,
            location: result.location.name,
            statusVideoEnd: result.statusVideoEnd,
            statusQuestionEnd: result.statusQuestionEnd
        };
        return res.status(200).json(data);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.checkIdCard = checkIdCard;
const updateVerify = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, checked } = req.body;
        console.log(req.body);
        if (!id)
            return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" });
        // Check 
        const resultCheck = yield db_1.default.member.findFirst({
            where: { id }
        });
        if (!resultCheck)
            return res.status(400).json({ message: "ไม่พบข้อมูล" });
        // Update
        yield db_1.default.member.update({
            where: { id },
            data: { verify: checked || 0 }
        });
        return res.status(201).json({ message: "ทำรายการสำเร็จ" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.updateVerify = updateVerify;
// member Change Company Report
// Certificate PDF
const certificatePDF = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idCard } = req.body;
        if (!idCard)
            return res.status(404).json({ message: "ส่งข้อมูลไม่ครบ !" });
        const idCardLength = idCard.length;
        let useIdCard = idCard;
        if (idCardLength > 13) {
            const decipher = yield (0, tools_1.decrypt)(idCard);
            useIdCard = decipher;
        }
        const member = yield db_1.default.member.findUnique({
            where: { idCard: useIdCard },
            include: {
                company: { select: { name: true } },
                location: { select: { name: true } },
                lecturer: { select: { name: true } }
            }
        });
        if (!member)
            return res.status(404).json({ message: "ไม่พบสามาชิกท่านนี้ !" });
        if (member && member.statusQuestionEnd !== 1)
            return res.status(404).json({ message: 'คุณยังไม่ทำข้อสอบ' });
        //  สร้าง PDF
        const pdfBytes = yield (0, tools_1.generatePdf)(member);
        res.setHeader('Content-Type', 'application/pdf');
        // res.send(Buffer.from(pdfBytes))
        res.send(pdfBytes);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.certificatePDF = certificatePDF;
const certificatePDFSend = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { idCard } = req.body;
        if (!idCard)
            return res.status(404).json({ message: "ส่งข้อมูลไม่ครบ !" });
        const idCardLength = idCard.length;
        let useIdCard = idCard;
        if (idCardLength > 13) {
            const decipher = yield (0, tools_1.decrypt)(idCard);
            useIdCard = decipher;
        }
        const member = yield db_1.default.member.findUnique({
            where: { idCard: useIdCard },
            include: {
                company: { select: { name: true } },
                location: { select: { name: true } },
                lecturer: { select: { name: true } }
            }
        });
        if (!member)
            return res.status(404).json({ message: 'Member not found' });
        if (member && member.statusQuestionEnd !== 1)
            return res.status(404).json({ message: 'คุณยังไม่ทำข้อสอบ' });
        // ส่ง mail
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const pdfBytes = yield (0, tools_1.generatePdf)(member);
        const namePDF = `certificate_${idCard}.pdf`;
        const formattedDateCertificateDMY = (0, moment_1.default)(member.dateOfTraining).format('DD/MM') + '/' + ((0, moment_1.default)(member.dateOfTraining).year() + 543);
        const formattedDateCertificateEndDMY = (0, moment_1.default)(member.dateEndCertificate).format('DD/MM') + '/' + ((0, moment_1.default)(member.dateEndCertificate).year() + 543);
        const text = ` ถึง ${member.titleName}${" "} ${member.fname} ${" "} ${member.lname} 
        รหัสบัตรประชาชน : ${member.idCard}
        วันที่ได้ใบเซอร์ : ${formattedDateCertificateDMY}
        ใบเซอร์ หมดอายุ : ${formattedDateCertificateEndDMY} 
        โปรดดูใบรับรองของคุณที่แนบมา`;
        yield (0, mail_service_1.sendMail)({
            to: (_a = member.email) !== null && _a !== void 0 ? _a : "",
            subject: `ยินดีต้อนรับคุณ xxx`,
            htmlBody: text,
            attachments: [
                {
                    filename: namePDF,
                    content: pdfBytes, // ส่ง Buffer เข้าไปโดยตรง
                    contentType: 'application/pdf',
                }
            ]
        });
        // ส่ง Gmail
        // await transporter.sendMail({
        //     from: `"Thai Business Mate" <${process.env.EMAIL_USER}>`,
        //     to: member.email ?? "",
        //     subject: 'ยินดีด้วย ! คุณสอบผ่านและได้ใบเซอร์แล้ว',
        //     text: text,
        //     attachments: [
        //         {
        //             filename: namePDF,
        //             content: pdfBytes,
        //             contentType: 'application/pdf',
        //         },
        //     ],
        // })
        // บันทึก DB
        yield db_1.default.member.update({
            where: { idCard: useIdCard },
            data: {
                dateEndCertificate: (0, date_fns_1.addYears)(new Date(), 2)
            }
        });
        res.status(200).json({ message: 'ส่ง Email สำเร็จ !!' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.certificatePDFSend = certificatePDFSend;
const certificateEnd = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.body;
        if (!id)
            return res.status(400).json({ message: 'ส่งข้อมูลไม่ครบ !' });
        const dateNow = (0, moment_1.default)().startOf('day').toDate();
        const dateYesterday = (0, moment_1.default)().subtract(1, 'days').startOf('day').toDate();
        yield db_1.default.member.update({
            where: { id },
            data: {
                dateEndCertificate: dateNow,
                dateOfTraining: dateYesterday,
            }
        });
        yield (0, tools_1.checkExpiredCertificates)();
        res.status(200).json({ message: 'ส่ง Email สำเร็จ !!' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.certificateEnd = certificateEnd;
const getImageMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { fileName } = req.body;
    if (!fileName) {
        return res.status(400).send('File name is required.');
    }
    const client = yield (0, ftpClient_1.createFtpClient)();
    try {
        const extension = (_a = fileName.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        let contentType = 'application/octet-stream'; // default
        if (extension === 'jpg' || extension === 'jpeg')
            contentType = 'image/jpeg';
        if (extension === 'png')
            contentType = 'image/png';
        if (extension === 'gif')
            contentType = 'image/gif';
        res.setHeader('Content-Type', contentType);
        yield client.downloadTo(res, fileName);
    }
    catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
            const ftpError = error;
            if (ftpError.code === 550) {
                // หาไฟล์ไม่เจอในขั้นตอน .size()
                return res.status(404).json({ message: `File not found: ${fileName}` });
            }
        }
        // จัดการ error อื่นๆ ที่อาจเกิดขึ้น
        return res.status(500).json({ message: "An unexpected server error occurred." });
    }
    finally {
        if (!client.closed) {
            yield client.close();
        }
    }
});
exports.getImageMember = getImageMember;
// Users
const memberUpdateDateOfTraining = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { dateOfTraining } = req.body;
        if (!id && !dateOfTraining)
            return res.status(400).json({ message: 'ส่งข้อมูลไม่ครบ' });
        yield db_1.default.member.update({ where: { idCard: id }, data: { dateOfTraining } });
        res.status(200).json({ message: 'บันทึกสำเร็จ', idCard: id });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.memberUpdateDateOfTraining = memberUpdateDateOfTraining;
const test = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const emailHtml = `
      <h1>สวัสดีคุณ xxxx!</h1>
      <p>ยินดีต้อนรับสู่บริการของเรา</p>
      <p>นี่คืออีเมลที่ส่งจากระบบอัตโนมัติโดยใช้ Microsoft Graph API ครับ</p>
    `;
        yield (0, mail_service_1.sendMail)({
            to: "devsriwararak.work@gmail.com",
            subject: `ยินดีต้อนรับคุณ xxx`,
            htmlBody: emailHtml,
        });
        res.status(200).json({ message: 'บันทึกสำเร็จ' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'An error occurred while sending the email.' });
    }
});
exports.test = test;
