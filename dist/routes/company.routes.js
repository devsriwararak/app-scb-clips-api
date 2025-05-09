"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const asyncHandler_1 = require("../utils/asyncHandler");
const company_controller_1 = require("../controllers/company.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get("/all", (0, asyncHandler_1.asyncHandler)(company_controller_1.getCompanys));
router.post('/add', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(company_controller_1.createCompany));
router.put('/:id', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(company_controller_1.updateCompany));
router.delete('/:id', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(company_controller_1.deleteCompany));
exports.default = router;
