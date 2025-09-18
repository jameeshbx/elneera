export interface DmcPaymentEmailProps {
  dmcName: string
  itineraryReference: string
  enquiryId: string
  totalCost: number | string
  amountPaid: number | string
  paymentDate: string
  remainingBalance: number | string
  paymentStatus: string
  paymentChannel: string
  transactionId?: string
  currency: string
  upiId?: string
}

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