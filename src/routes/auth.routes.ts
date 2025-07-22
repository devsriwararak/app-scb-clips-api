
import express from 'express'
import { asyncHandler } from '../utils/asyncHandler';
import { login, logout, refreshTokene, registerTest, varidateMember } from '../controllers/auth.controller';
const router = express.Router();

router.post("/register", asyncHandler(registerTest));
router.post("/login", asyncHandler(login))
router.post("/logout", asyncHandler(logout))
router.post("/refresh-token", asyncHandler(refreshTokene))

// check login
router.post("/validate-member", asyncHandler(varidateMember))



export default router;