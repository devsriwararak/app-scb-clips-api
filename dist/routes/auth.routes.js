"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const asyncHandler_1 = require("../utils/asyncHandler");
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
router.post("/register", (0, asyncHandler_1.asyncHandler)(auth_controller_1.registerTest));
router.post("/login", (0, asyncHandler_1.asyncHandler)(auth_controller_1.login));
exports.default = router;
