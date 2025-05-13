"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureToken = exports.generateToken = exports.expiresAt = exports.sanitizeFilename = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
};
exports.sanitizeFilename = sanitizeFilename;
const expiresAt = () => {
    const limit = Math.floor(Date.now() / 1000) + 60;
    return limit;
};
exports.expiresAt = expiresAt;
const generateToken = (idCard, filePath, expiresAt) => {
    const secret = process.env.STREAM_SECRET || "mysecret";
    const raw = `${idCard}|${filePath}|${expiresAt}|${secret}`;
    return crypto_1.default.createHash("sha256").update(raw).digest("hex");
};
exports.generateToken = generateToken;
const generateSecureToken = (idCard, filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 นาที
    yield db_1.default.videoToken.create({
        data: {
            token,
            filePath,
            idCard,
            expiresAt
        }
    });
    return token;
});
exports.generateSecureToken = generateSecureToken;
