export interface DMCRegistrationData {
  dmcName: string;
  primaryContact: string;
  phoneNumber: string;
  designation: string;
  ownerName: string;
  ownerPhoneNumber: string;
  email: string;
  website: string;
  primaryCountry: string;
  destinationsCovered: string;
  cities: string;
  gstRegistration: "Yes" | "No";
  gstNo: string;
  yearOfRegistration: string;
  panNo: string;
  panType: string;
  headquarters: string;
  country: string;
  yearOfExperience: string;
  registrationCertificate: File | null;
  primaryPhoneExtension: string;
  ownerPhoneExtension: string;
}

export interface DMCRegistrationResponse {
  success: boolean;
  message: string;
  data?: DMCRegistrationData;
  error?: string;
}

export interface BankDetails {
  accountHolderName: string
  bankName: string
  branchName: string
  accountNumber: string
  ifscCode: string
  bankCountry: string
  currency: string
  notes?: string
}

export interface PaymentMethod {
  type: "BANK_ACCOUNT" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI" | "QR_CODE" | "PAYMENT_GATEWAY"
  name: string
  identifier: string
  bankName?: string
  branchName?: string
  ifscCode?: string
  bankCountry?: string
  currency?: string
  cardHolder?: string
  expiryDate?: string
  upiProvider?: string
  paymentLink?: string
  qrCodeId?: string
  notes?: string
}
