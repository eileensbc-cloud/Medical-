export interface MedicalClaimRecord {
  id: string;
  employeeName: string;
  clinicName: string;
  subTotal: number;
  gst: number;
  grandTotal: number;
  illnessSummary: string;
  date?: string;
  receiptNumber?: string;
  currency?: string;
  lineItems?: Array<{ description: string; amount: number }>;
  notes?: string;
  receiptImageUrl?: string;
  fileName?: string;
  uploadedAt: string;
  status: 'extracted' | 'verified' | 'manual';
}

export interface ExtractionResponse {
  success: boolean;
  data: {
    employeeName: string;
    clinicName: string;
    subTotal: number;
    gst: number;
    grandTotal: number;
    illnessSummary: string;
    date?: string;
    receiptNumber?: string;
    currency?: string;
    lineItems?: Array<{ description: string; amount: number }>;
    notes?: string;
  };
  fileName?: string;
  error?: string;
}
