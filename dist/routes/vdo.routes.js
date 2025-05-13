"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const asyncHandler_1 = require("../utils/asyncHandler");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const vdo_controller_1 = require("../controllers/vdo.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: "tmp/" });
router.get('/all', (0, asyncHandler_1.asyncHandler)(vdo_controller_1.getAllVideos));
router.post("/upload", auth_middleware_1.authenticateToken, upload.single("video"), (0, asyncHandler_1.asyncHandler)(vdo_controller_1.uploadVideo));
router.put("/upload/:id", auth_middleware_1.authenticateToken, upload.single("video"), (0, asyncHandler_1.asyncHandler)(vdo_controller_1.updateVideo));
router.delete("/:id", auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(vdo_controller_1.deleteVideo));
// User
router.post('/secure/checkIdCard', (0, asyncHandler_1.asyncHandler)(vdo_controller_1.getSecureVideos));
router.get('/stream', (0, asyncHandler_1.asyncHandler)(vdo_controller_1.streamVideo));
router.post('/end', (0, asyncHandler_1.asyncHandler)(vdo_controller_1.EndStreamVideo));
exports.default = router;
