interface WelcomeEmailParams {
  name: string;
  email: string;
  password: string;
  userType: string;
  loginUrl: string;
}

export const getNewUserWelcomeEmail = ({ name, email, password, userType, loginUrl }: WelcomeEmailParams) => ({
  subject: `Your Account Has Been Updated`,
  html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2563eb; margin: 0 0 10px 0;">Your Account Has Been Updated</h1>
        <p style="color: #4b5563; margin: 0;">${name}, your account details have been updated by an administrator.</p>
      </div>
      
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="margin-top: 0; color: #1e293b;">Your Login Credentials:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; width: 150px;"><strong>Email/Username:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Password:</strong></td>
            <td style="padding: 8px 0;">${password}</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 20px 0; color: #4b5563;">To log in to your account, </p>
        <a href="${loginUrl}" 
           style="display: inline-block; background-color: #2563eb; color: white; 
                  padding: 12px 30px; text-decoration: none; border-radius: 6px;
                  font-weight: 600; font-size: 16px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Login to Your Account
        </a>
        <p style="margin: 15px 0 0 0; font-size: 14px; color: #64748b;">
          <em>This link will expire in 24 hours.</em>
        </p>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
        <p style="margin: 0 0 10px 0;">For security reasons, we recommend changing your password after your first login.</p>
        <p style="margin: 0;">If you didn't request this change, please contact our support team immediately.</p>
      </div>
      
        <p style="margin: 30px 0 0 0; text-align: center; color: #64748b;">
        Best regards,<br>
        <strong>The Support Team</strong>
      </p>
    </div>
  `
});

function formatUserType(userType: string): string {
  const typeMap: Record<string, string> = {
    'TEAM_LEAD': 'Team Lead',
    'MANAGER': 'Manager',
    'TL': 'Telecaller',
    'EXECUTIVE': 'Executive',
    'TRAVEL_AGENCY': 'Agency Admin',
    'ADMIN': 'Administrator'
  };
  return typeMap[userType] || userType;
}

function getDashboardName(userType: string): string {
  const dashboardMap: Record<string, string> = {
    'TEAM_LEAD': 'Team Lead Dashboard',
    'MANAGER': 'Agency Dashboard',
    'TL': 'Telecaller Dashboard',
    'EXECUTIVE': 'Executive Dashboard',
    'TRAVEL_AGENCY': 'Agency Admin Dashboard',
    'ADMIN': 'Admin Dashboard'
  };
  return dashboardMap[userType] || 'Dashboard';
}