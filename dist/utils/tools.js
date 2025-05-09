"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFilename = void 0;
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
};
exports.sanitizeFilename = sanitizeFilename;
