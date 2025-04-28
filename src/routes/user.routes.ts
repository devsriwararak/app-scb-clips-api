import { Router } from "express";
import * as userController from "../controllers/user.controller"
import { asyncHandler } from "../utils/asyncHandler";
import { authenticateToken } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";

const router = Router()
// router.get('/', authenticateToken, isAdmin, asyncHandler(userController.getUsers))
router.get('/', authenticateToken, isAdmin, asyncHandler(userController.getUsers))

export default router