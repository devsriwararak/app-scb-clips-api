import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticateToken } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import { createMemberChangeCompany, deleteChangeCompany, getMemberChageCompany } from "../controllers/report.controller";

const router = Router()
router.get('/changeCompany/all', authenticateToken, asyncHandler(getMemberChageCompany))
router.delete('/changeCompany/:id', authenticateToken, asyncHandler(deleteChangeCompany))

export default router