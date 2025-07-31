import 'isomorphic-fetch'; // จำเป็นสำหรับ Graph Client
import * as dotenv from 'dotenv';
import * as msal from '@azure/msal-node';
import { Client, AuthenticationProvider } from '@microsoft/microsoft-graph-client';

import { Message } from '@microsoft/microsoft-graph-types';
dotenv.config()

const { MAIL_TENANT_ID, MAIL_CLIENT_ID, MAIL_CLIENT_SECRET, MAIL_SENDER_ADDRESS } = process.env

if (!MAIL_TENANT_ID || !MAIL_CLIENT_ID || !MAIL_CLIENT_SECRET || !MAIL_SENDER_ADDRESS) {
    throw new Error('ไม่พบข้อมูลสำคัญ !!');
}

const msalConfig: msal.Configuration = {
    auth: {
        clientId: MAIL_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${MAIL_TENANT_ID}`,
        clientSecret: MAIL_CLIENT_SECRET
    }
}

const confidentialClientApplication = new msal.ConfidentialClientApplication(msalConfig)

const authProvider: AuthenticationProvider = {
  getAccessToken: async (): Promise<string> => {
    const tokenRequest: msal.ClientCredentialRequest = {
      scopes: ['https://graph.microsoft.com/.default'],
    };

    const response = await confidentialClientApplication.acquireTokenByClientCredential(tokenRequest);

    if (response && response.accessToken) {
      return response.accessToken;
    } else {
      throw new Error('Authentication failed: No access token received.');
    }
  },
};

const graphClient = Client.initWithMiddleware({ authProvider })

export interface SendMailOptions {
    to: string | string[]; // รองรับผู้รับคนเดียวหรือหลายคน
    subject: string;
    htmlBody: string;
    cc?: string | string[]; // Optional: สำหรับ CC
}

/**
 * ฟังก์ชันสำหรับส่งอีเมลผ่าน Microsoft Graph API
 * @param options - ข้อมูลอีเมลที่ต้องการส่ง
 */

export async function sendMail(options: SendMailOptions): Promise<void> {
    const { to, subject, htmlBody, cc } = options;

    // แปลง array ของ string
    const toRecipients = (Array.isArray(to) ? to : [to]).map(addr => ({ emailAddress: { address: addr } }));
    const ccRecipients = cc ? (Array.isArray(cc) ? cc : [cc]).map(addr => ({ emailAddress: { address: addr } })) : undefined;

    const mailMessage: Message = {
        subject: subject,
        body: {
            contentType: 'html', 
            content: htmlBody,
        },
        toRecipients: toRecipients,
        ccRecipients: ccRecipients,
    };
    try {
        console.log(`Attempting to send email from ${MAIL_SENDER_ADDRESS}...`);

        // เรียก API เพื่อส่งอีเมล
        await graphClient
            .api(`/users/${MAIL_SENDER_ADDRESS}/sendMail`)
            .post({
                message: mailMessage,
                saveToSentItems: 'true' // บันทึกใน Sent Items
            });

        console.log(`Email successfully sent to: ${to}`);
    } catch (error: any) {
        // แสดง error ที่ละเอียดขึ้นเพื่อช่วยในการ debug
        console.error('Error sending email via Microsoft Graph:', error?.body || error?.message || error);
        throw new Error('Failed to send email.');
    }
}