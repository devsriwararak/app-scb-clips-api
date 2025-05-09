"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const asyncHandler_1 = require("../utils/asyncHandler");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const location_controller_1 = require("../controllers/location.controller");
const router = express_1.default.Router();
router.get("/all", (0, asyncHandler_1.asyncHandler)(location_controller_1.getLocations));
router.get("/:idll", (0, asyncHandler_1.asyncHandler)(location_controller_1.getLocationById));
router.post('/add', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(location_controller_1.createLocation));
router.put('/:id', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(location_controller_1.updateLocation));
router.delete('/:id', auth_middleware_1.authenticateToken, (0, asyncHandler_1.asyncHandler)(location_controller_1.deleteLocation));
exports.default = router;
