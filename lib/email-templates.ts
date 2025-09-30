export interface AgencyApprovalEmailProps {
  agencyId: string;
  agencyName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  agencyType: string;
  website?: string;
  gstNumber?: string;
  panNumber: string;
  headquarters: string;
  registrationDate: string;
  status?: string;
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
  email,
  phoneNumber,
  agencyType,
  website,
  gstNumber,
  panNumber,
  headquarters,
  registrationDate,
  status = 'PENDING'
}: AgencyApprovalEmailProps) => `
<!DOCTYPE html>
<html>
<head>
  <title>Agency Registration - Action Required</title>
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
    .content {
      background-color: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
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
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      color: #6c757d;
      font-size: 14px;
    }
    #statusMessage {
      margin-top: 20px;
      padding: 10px;
      border-radius: 4px;
      display: none;
    }
    .success {
      background-color: #d4edda;
      color: #155724;
    }
    .error {
      background-color: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Agency Registration - Action Required</h1>
  </div>
  
  <div class="content">
    <h2 style="color: #2c3e50; margin-top: 0;">New Agency Registration</h2>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <p style="margin: 5px 0;"><strong>Status:</strong> 
        <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; background-color: ${status === 'ACTIVE' ? '#d4edda' : status === 'REJECTED' ? '#f8d7da' : '#fff3cd'}; color: ${status === 'ACTIVE' ? '#155724' : status === 'REJECTED' ? '#721c24' : '#856404'};">
          ${status}
        </span>
      </p>
      <p style="margin: 5px 0;"><strong>Registration ID:</strong> ${agencyId}</p>
      <p style="margin: 5px 0;"><strong>Registration Date:</strong> ${new Date(registrationDate).toLocaleDateString()}</p>
    </div>
    
    <h3 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">Agency Details</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
      <div>
        <p style="margin: 8px 0;"><strong>Agency Name:</strong><br>${agencyName}</p>
        <p style="margin: 8px 0;"><strong>Contact Person:</strong><br>${contactPerson}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong><br>${email}</p>
        <p style="margin: 8px 0;"><strong>Phone:</strong><br>${phoneNumber}</p>
      </div>
      <div>
        <p style="margin: 8px 0;"><strong>Agency Type:</strong><br>${agencyType}</p>
        ${website ? `<p style="margin: 8px 0;"><strong>Website:</strong><br><a href="${website.startsWith('http') ? website : 'https://' + website}" target="_blank">${website}</a></p>` : ''}
        <p style="margin: 8px 0;"><strong>PAN Number:</strong><br>${panNumber}</p>
        ${gstNumber ? `<p style="margin: 8px 0;"><strong>GST Number:</strong><br>${gstNumber}</p>` : ''}
        <p style="margin: 8px 0;"><strong>Headquarters:</strong><br>${headquarters}</p>
      </div>
    </div>
    
    <div style="margin: 30px 0 20px; text-align: center;">
      <h3 style="color: #2c3e50; margin-bottom: 15px;">Action Required</h3>
      <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 15px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/agencyform/approve?agencyId=${agencyId}" class="btn btn-approve" style="min-width: 120px; text-decoration: none;">
          Approve
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/agencyform/reject?agencyId=${agencyId}" class="btn btn-reject" style="min-width: 120px; text-decoration: none;">
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

  <!-- JavaScript removed as email clients don't support it -->
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