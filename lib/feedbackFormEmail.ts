export const feedbackFormEmailTemplate = (customerName: string, feedbackLink: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2>Hi ${customerName},</h2>
    <p>We value your feedback and would love to hear about your experience with us.</p>
    <p>Please click the link below to fill out our feedback form:</p>
    <a href="${feedbackLink}" style="color: #007BFF; text-decoration: none;">Provide Feedback</a>
    <p>Thank you for your time!</p>
    <p>Best regards,</p>
    <p>Your Company Name</p>
  </div>
`;