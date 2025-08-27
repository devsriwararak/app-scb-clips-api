"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const asyncHandler_1 = require("../utils/asyncHandler");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const member_controller_1 = require("../controllers/member.controller");
const multer_1 = __importDefault(require("multer"));
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ dest: 'uploads/' });
router.get("/all", (0, asyncHandler_1.asyncHandler)(member_controller_1.getMembers));
router.post('/add', upload_middleware_1.uploadServer.single('image'), (0, asyncHandler_1.asyncHandler)(member_controller_1.createMember));
router.put('/:id', upload_middleware_1.uploadServer.single('image'), auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(member_controller_1.updateMember));
router.delete('/:id', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(member_controller_1.deleteMember));
router.post('/checkIdCard', (0, asyncHandler_1.asyncHandler)(member_controller_1.checkIdCard));
router.post('/updateVerify', (0, asyncHandler_1.asyncHandler)(member_controller_1.updateVerify));
router.post('/image', (0, asyncHandler_1.asyncHandler)(member_controller_1.getImageMember));
//certificate
router.post('/certificate', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(member_controller_1.certificatePDF));
router.post('/certificate/send', (0, asyncHandler_1.asyncHandler)(member_controller_1.certificatePDFSend));
router.post('/certificate/end', (0, asyncHandler_1.asyncHandler)(member_controller_1.certificateEnd));
// Users
router.put('/user/update/:id', (0, asyncHandler_1.asyncHandler)(member_controller_1.memberUpdateDateOfTraining));
exports.default = router;
