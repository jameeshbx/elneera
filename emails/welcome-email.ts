export const getWelcomeEmail = (name: string) => ({
  subject: 'Welcome to Our Platform!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome to Our Platform, ${name}!</h2>
      <p>Thank you for signing up. Your account has been successfully created.</p>
      <p>We're excited to have you on board!</p>
      <p>If you have any questions, feel free to reply to this email.</p>
      <br>
      <p>Best regards,<br>The Team</p>
    </div>
  `
});
