"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const asyncHandler_1 = require("../utils/asyncHandler");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const member_controller_1 = require("../controllers/member.controller");
const router = express_1.default.Router();
router.get("/all", (0, asyncHandler_1.asyncHandler)(member_controller_1.getMembers));
router.post('/add', (0, asyncHandler_1.asyncHandler)(member_controller_1.createMember));
router.put('/:id', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(member_controller_1.updateMember));
router.delete('/:id', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(member_controller_1.deleteMember));
router.post('/checkIdCard', (0, asyncHandler_1.asyncHandler)(member_controller_1.checkIdCard));
exports.default = router;
