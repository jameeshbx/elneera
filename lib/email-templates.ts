export interface AgencyApprovalEmailProps {
  agencyId: string;
  agencyName: string;
  contactPerson: string;
  designation: string;
  email: string;
  phoneNumber: string;
  phoneCountryCode: string;
  ownerName: string;
  companyPhone: string;
  companyPhoneCode: string;
  website?: string;
  landingPageColor: string;
  gstRegistered: boolean;
  yearOfRegistration: string;
  panNumber: string;
  panType?: string;
  gstNumber?: string;
  headquarters: string;
  country: string;
  yearsOfOperation: string;
  agencyType: string;
  registrationDate: string;
  status: string;
  businessLicenseUrl?: string;
  logoUrl?: string;
}

export interface DmcPaymentEmailProps {
  dmcName: string;
  itineraryReference: string;
  enquiryId: string;
  totalCost: number | string;
  amountPaid: number | string;
  paymentDate: string;
  remainingBalance: number | string;
  paymentStatus: string;
  paymentChannel: string;
  transactionId?: string;
  currency: string;
  upiId?: string;
}

export const agencyApprovalEmailTemplate = ({
  agencyId,
  agencyName,
  contactPerson,
  designation,
  email,
  phoneNumber,
  phoneCountryCode,
  ownerName,
  companyPhone,
  companyPhoneCode,
  website,
  landingPageColor,
  gstRegistered,
  yearOfRegistration,
  panNumber,
  panType,
  gstNumber,
  headquarters,
  country,
  yearsOfOperation,
  agencyType,
  registrationDate,
  status,
  businessLicenseUrl,
  logoUrl
}: AgencyApprovalEmailProps) => `
<!DOCTYPE html>
<html>
<head>
  <title>New Agency Registration: ${agencyName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #4ECDC4;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 25px;
    }
    h3 {
      color: #2c3e50;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
      margin-top: 25px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    table, th, td {
      border: 1px solid #e0e0e0;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      vertical-align: top;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
      .btn {
      display: inline-block;
      padding: 10px 20px;
      margin: 10px 10px 10px 0;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
      cursor: pointer;
      border: none;
      font-size: 14px;
    }
    .btn-approve {
      background-color: #28a745;
      color: white;
    }
    .btn-reject {
      background-color: #dc3545;
      color: white;
    }
    .details {
      background: #f9f9f9;
      border-left: 4px solid #4ECDC4;
      padding: 15px;
      margin: 20px 0;
    }
    .status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
      text-transform: uppercase;
    }
    .status.pending {
      background-color: #fff3cd;
      color: #856404;
    }
    .status.approved {
      background-color: #d4edda;
      color: #155724;
    }
    .status.rejected {
      background-color: #f8d7da;
      color: #721c24;
    }
    .actions {
      text-align: center;
      margin: 30px 0 20px;
    }
    .button {
      display: inline-block;
      background-color: #4ECDC4;
      color: white;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #3dbeb5;
    }
    .footer {
      text-align: center;
      padding: 15px;
      font-size: 12px;
      color: #777;
      background-color: #f5f5f5;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New Agency Registration: ${agencyName}</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Action Required: Please review this agency registration</p>
      </div>
      
      <div class="content">
        <p>Hello Admin,</p>
        
        <p>A new agency has registered and requires your approval. Below are the details:</p>
        
        <div class="details">
          <h3> Basic Information</h3>
          <table>
            <tr><td><strong>Agency ID:</strong></td><td>${agencyId}</td></tr>
            <tr><td><strong>Agency Name:</strong></td><td>${agencyName}</td></tr>
            <tr><td><strong>Owner Name:</strong></td><td>${ownerName}</td></tr>
            <tr><td><strong>Contact Person:</strong></td><td>${contactPerson}</td></tr>
            <tr><td><strong>Designation:</strong></td><td>${designation || 'N/A'}</td></tr>
            <tr><td><strong>Email:</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td><strong>Phone:</strong></td><td>${phoneCountryCode || '+91'} ${phoneNumber}</td></tr>
            <tr><td><strong>Company Phone:</strong></td><td>${companyPhoneCode || '+91'} ${companyPhone}</td></tr>
            <tr><td><strong>Website:</strong></td><td>${website ? `<a href="${website.startsWith('http') ? '' : 'https://'}${website}" target="_blank">${website}</a>` : 'N/A'}</td></tr>
            <tr><td><strong>Landing Page Color:</strong></td><td>${landingPageColor} <span style="display: inline-block; width: 20px; height: 20px; background-color: ${landingPageColor}; border: 1px solid #ddd; vertical-align: middle; margin-left: 10px;"></span></td></tr>
          </table>

          <h3> Business Details</h3>
          <table>
            <tr><td><strong>Agency Type:</strong></td><td>${agencyType || 'N/A'}</td></tr>
            <tr><td><strong>Years of Operation:</strong></td><td>${yearsOfOperation || 'N/A'}</td></tr>
            <tr><td><strong>Year of Registration:</strong></td><td>${yearOfRegistration || 'N/A'}</td></tr>
            <tr><td><strong>GST Registered:</strong></td><td>${gstRegistered ? 'Yes' : 'No'}</td></tr>
            ${gstNumber ? `<tr><td><strong>GST Number:</strong></td><td>${gstNumber}</td></tr>` : ''}
            <tr><td><strong>PAN Type:</strong></td><td>${panType || 'N/A'}</td></tr>
            <tr><td><strong>PAN Number:</strong></td><td>${panNumber || 'N/A'}</td></tr>
          </table>

          <h3> Address</h3>
          <table>
            <tr><td><strong>Headquarters:</strong></td><td>${headquarters || 'N/A'}</td></tr>
            <tr><td><strong>Country:</strong></td><td>${country || 'N/A'}</td></tr>
          </table>

          <h3> Attachments</h3>
          <table>
            <tr>
              <td><strong>Business License:</strong></td>
              <td>${businessLicenseUrl ?
    `<a href="${businessLicenseUrl}" target="_blank" style="color: #4ECDC4; text-decoration: none; font-weight: bold;">View Document</a>` :
    'Not provided'}
              </td>
            </tr>
            <tr>
              <td><strong>Logo:</strong></td>
              <td>${logoUrl ?
    `<a href="${logoUrl}" target="_blank" style="color: #4ECDC4; text-decoration: none; font-weight: bold;">View Logo</a>` :
    'Not provided'}
              </td>
            </tr>
          </table>

          <div style="margin-top: 25px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #4ECDC4;">
            <p style="margin: 0; font-weight: 500; color: #2c3e50;">Registration Date: ${new Date(registrationDate).toLocaleString()}</p>
            <p style="margin: 5px 0 0; font-weight: 500;">Status: <span class="status ${status.toLowerCase()}">${status}</span></p>
          </div>
        </div>
        
            <div style="margin: 30px 0 20px; text-align: center;">
      <h3 style="color: #2c3e50; margin-bottom: 15px;">Action Required</h3>
      <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 15px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/agencyform/approve?agencyId=${agencyId}" class="btn btn-approve text-white" style="min-width: 120px; text-decoration: none;">
          Approve
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/agencyform/reject?agencyId=${agencyId}" class="btn btn-reject text-white" style="min-width: 120px; text-decoration: none;">
          Reject
        </a>
      </div>
      <p style="font-size: 12px; color: #6c757d; margin-top: 10px;">
        Clicking a button will update the agency's status in our system.
      </p>
    </div>
    
    <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; display: none;" id="statusMessage">
      <!-- Status message will be shown here after clicking a link -->
    </div>
  </div>
  
  <div class="footer">
    <p>This is an automated notification. Please do not reply to this email.</p>
  </div>
    
  </body>
</html>
`;

export const dmcPaymentNotificationTemplate = ({
  dmcName,
  enquiryId,
  totalCost,
  amountPaid,
  paymentDate,
  remainingBalance,
  paymentStatus,
  paymentChannel,
  transactionId,
  currency,
  upiId,
}: DmcPaymentEmailProps) => `
<!DOCTYPE html>
<html>
<head>
  <title>Payment Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .payment-details {
      background-color: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .payment-details h2 {
      color: #495057;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    .payment-details ul {
      list-style: none;
      padding: 0;
    }
    .payment-details li {
      padding: 8px 0;
      border-bottom: 1px solid #f8f9fa;
    }
    .payment-details li:last-child {
      border-bottom: none;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-paid {
      background-color: #d4edda;
      color: #155724;
    }
    .status-partial {
      background-color: #fff3cd;
      color: #856404;
    }
    .status-pending {
      background-color: #f8d7da;
      color: #721c24;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Payment Notification</h1>
    <p>Dear ${dmcName},</p>
    <p>This is to inform you about a recent payment made for your services.</p>
  </div>
  
  <div class="payment-details">
    <h2>Payment Details</h2>
    <ul>
      <li><strong>Enquiry ID:</strong> ${enquiryId.substring(0, 8)}</li>
      <li><strong>Total Cost:</strong> ${totalCost} ${currency}</li>
      <li><strong>Amount Paid:</strong> ${amountPaid} ${currency}</li>
      <li><strong>Payment Date:</strong> ${paymentDate}</li>
      <li><strong>Remaining Balance:</strong> ${remainingBalance} ${currency}</li>
      <li><strong>Status:</strong> <span class="status-badge status-${paymentStatus.toLowerCase()}">${paymentStatus}</span></li>
      <li><strong>Payment Channel:</strong> ${paymentChannel}</li>
      ${paymentChannel === 'UPI' && upiId ? `<li><strong>UPI ID:</strong> ${upiId}</li>` : ''}
      ${transactionId ? `<li><strong>Transaction ID:</strong> ${transactionId}</li>` : ""}
    </ul>
  </div>
  
  <div class="footer">
    <p>This is an automated notification. Please keep this email for your records.</p>
    <p>If you have any questions regarding this payment, please contact our support team.</p>
    <p>Thank you for your business.</p>
  </div>
</body>
</html>
`;