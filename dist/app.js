"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const error_middleware_1 = require("./middlewares/error.middleware");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Component
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const lecturer_routes_1 = __importDefault(require("./routes/lecturer.routes"));
const vdo_routes_1 = __importDefault(require("./routes/vdo.routes"));
const question_routes_1 = __importDefault(require("./routes/question.routes"));
const questionEnd_routes_1 = __importDefault(require("./routes/questionEnd.routes"));
const member_routes_1 = __importDefault(require("./routes/member.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://192.168.1.107:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// test
app.get('/', (req, res) => {
    res.send('server runing');
});
app.use('/api/users', user_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/company', company_routes_1.default);
app.use('/api/location', location_routes_1.default);
app.use('/api/lecturer', lecturer_routes_1.default);
app.use('/api/vdo', vdo_routes_1.default);
app.use('/api/question', question_routes_1.default);
app.use('/api/questionEnd', questionEnd_routes_1.default);
app.use('/api/member', member_routes_1.default);
app.use('/api/report', report_routes_1.default);
// Middleware จัดการ Error
app.use(error_middleware_1.errorHandler);
exports.default = app;
