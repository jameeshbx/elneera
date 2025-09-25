// types/email.ts
import { string } from "zod";

// Single source of truth for EmailAttachment type
export type EmailAttachment = {
  filename: string;
  contentType: string;
} & (
  | {
      content: Buffer;
      encoding: string;
      path?: never;
    }
  | {
      path: string;
      content?: never;
      encoding?: never;
    }
);

// Email configuration type
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email send options
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

// Email send result
export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}