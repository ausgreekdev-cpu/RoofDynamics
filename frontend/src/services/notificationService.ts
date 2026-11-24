/**
 * RoofDynamics - Notification Service
 * Email (Resend/SendGrid) and SMS (Twilio) integration.
 * Currently uses mock implementations for demo.
 */
import { env } from "../env";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export interface SMSPayload {
  to: string;
  message: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class NotificationService {
  private emailProvider: string;
  private smsProvider: string;

  constructor() {
    this.emailProvider = env.VITE_EMAIL_PROVIDER;
    this.smsProvider = env.VITE_SMS_PROVIDER;
  }

  async sendEmail(payload: EmailPayload): Promise<NotificationResult> {
    // Email send (mock or production provider)
    // Mock implementation - in production, use Resend or SendGrid
    if (this.emailProvider === "mock") {
      await new Promise((r) => setTimeout(r, 500));
      return { success: true, messageId: `mock-email-${Date.now()}` };
    }
    // Production: implement Resend/SendGrid API call
    return { success: false, error: "Email provider not configured" };
  }

  async sendSMS(payload: SMSPayload): Promise<NotificationResult> {
    // SMS send (mock or production provider)
    // Mock implementation - in production, use Twilio
    if (this.smsProvider === "mock") {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, messageId: `mock-sms-${Date.now()}` };
    }
    // Production: implement Twilio API call
    return { success: false, error: "SMS provider not configured" };
  }

  // Pre-built notification templates
  async sendQuoteEmail(customerEmail: string, quoteNumber: string, amount: number) {
    return this.sendEmail({
      to: customerEmail,
      subject: `Your Roofing Quote ${quoteNumber} - RoofDynamics`,
      html: `
        <h2>Your Roofing Quote</h2>
        <p>Thank you for your interest in our roofing services.</p>
        <p>Quote Number: ${quoteNumber}</p>
        <p>Total (inc GST): $${amount.toLocaleString()}</p>
        <p>This quote is valid for 30 days.</p>
        <p>Contact us to proceed or accept online.</p>
      `,
    });
  }

  async sendInvoiceEmail(customerEmail: string, invoiceNumber: string, amount: number, dueDate: string) {
    return this.sendEmail({
      to: customerEmail,
      subject: `Invoice ${invoiceNumber} - RoofDynamics`,
      html: `
        <h2>Tax Invoice</h2>
        <p>Invoice Number: ${invoiceNumber}</p>
        <p>Amount Due: $${amount.toLocaleString()}</p>
        <p>Due Date: ${dueDate}</p>
        <p>Please make payment by the due date.</p>
      `,
    });
  }

  async sendWeatherWarningSMS(crewPhone: string, windSpeed: number) {
    return this.sendSMS({
      to: crewPhone,
      message: `RoofDynamics Alert: High wind (${windSpeed} km/h) detected. Roof work suspended until conditions improve. Stay safe!`,
    });
  }

  async sendJobReminderSMS(crewPhone: string, jobNumber: string, scheduledDate: string) {
    return this.sendSMS({
      to: crewPhone,
      message: `RoofDynamics: Job ${jobNumber} scheduled for ${scheduledDate}. Please confirm attendance.`,
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
