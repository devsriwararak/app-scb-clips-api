"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
require("isomorphic-fetch"); // จำเป็นสำหรับ Graph Client
const dotenv = __importStar(require("dotenv"));
const msal = __importStar(require("@azure/msal-node"));
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
dotenv.config();
const { MAIL_TENANT_ID, MAIL_CLIENT_ID, MAIL_CLIENT_SECRET, MAIL_SENDER_ADDRESS } = process.env;
if (!MAIL_TENANT_ID || !MAIL_CLIENT_ID || !MAIL_CLIENT_SECRET || !MAIL_SENDER_ADDRESS) {
    throw new Error('ไม่พบข้อมูลสำคัญ !!');
}
const msalConfig = {
    auth: {
        clientId: MAIL_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${MAIL_TENANT_ID}`,
        clientSecret: MAIL_CLIENT_SECRET
    }
};
const confidentialClientApplication = new msal.ConfidentialClientApplication(msalConfig);
const authProvider = {
    getAccessToken: () => __awaiter(void 0, void 0, void 0, function* () {
        const tokenRequest = {
            scopes: ['https://graph.microsoft.com/.default'],
        };
        const response = yield confidentialClientApplication.acquireTokenByClientCredential(tokenRequest);
        if (response && response.accessToken) {
            return response.accessToken;
        }
        else {
            throw new Error('Authentication failed: No access token received.');
        }
    }),
};
const graphClient = microsoft_graph_client_1.Client.initWithMiddleware({ authProvider });
/**
 * ฟังก์ชันสำหรับส่งอีเมลผ่าน Microsoft Graph API
 * @param options - ข้อมูลอีเมลที่ต้องการส่ง
 */
function sendMail(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { to, subject, htmlBody, cc, attachments } = options;
        // แปลง array ของ string
        const toRecipients = (Array.isArray(to) ? to : [to]).map(addr => ({ emailAddress: { address: addr } }));
        const ccRecipients = cc ? (Array.isArray(cc) ? cc : [cc]).map(addr => ({ emailAddress: { address: addr } })) : undefined;
        const mailMessage = {
            subject: subject,
            body: {
                contentType: 'html',
                content: htmlBody,
            },
            toRecipients: toRecipients,
            ccRecipients: ccRecipients,
        };
        // For PDF
        if (attachments && attachments.length > 0) {
            mailMessage.attachments = attachments.map(att => {
                // แปลง Buffer เป็น Base64 string ซึ่งเป็น format ที่ Graph API ต้องการ
                const contentBuffer = Buffer.from(att.content);
                const contentBytes = contentBuffer.toString('base64');
                return {
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: att.filename,
                    contentType: att.contentType,
                    contentBytes: contentBytes,
                };
            });
        }
        try {
            console.log(`Attempting to send email from ${MAIL_SENDER_ADDRESS}...`);
            // เรียก API เพื่อส่งอีเมล
            yield graphClient
                .api(`/users/${MAIL_SENDER_ADDRESS}/sendMail`)
                .post({
                message: mailMessage,
                saveToSentItems: 'true' // บันทึกใน Sent Items
            });
            console.log(`Email successfully sent to: ${to}`);
        }
        catch (error) {
            // แสดง error ที่ละเอียดขึ้นเพื่อช่วยในการ debug
            console.error('Error sending email via Microsoft Graph:', (error === null || error === void 0 ? void 0 : error.body) || (error === null || error === void 0 ? void 0 : error.message) || error);
            throw new Error('Failed to send email.');
        }
    });
}
