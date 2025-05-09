"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const asyncHandler_1 = require("../utils/asyncHandler");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const question_controller_1 = require("../controllers/question.controller");
const router = express_1.default.Router();
router.get("/all", auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(question_controller_1.getQuestions));
router.post('/add', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(question_controller_1.createQuestion));
router.put('/:id', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(question_controller_1.updateQuestion));
router.delete('/:id', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(question_controller_1.deleteQuestion));
exports.default = router;
