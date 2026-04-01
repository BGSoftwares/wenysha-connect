import { z } from "zod";

// ── Admission Form ──
export const admissionSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name must be under 100 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be under 255 characters"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 digits")
    .max(20, "Phone number is too long")
    .regex(/^\+?[0-9\s()-]+$/, "Please enter a valid phone number"),
  gender: z.enum(["male", "female"], { required_error: "Please select a gender" }),
  dateOfBirth: z.string().optional(),
  address: z.string().trim().max(255, "Address must be under 255 characters").optional(),
  previousSchool: z.string().trim().max(255).optional(),
  resultSlip: z.custom<File | null>().optional(),
  guardianName: z
    .string()
    .trim()
    .min(3, "Guardian name must be at least 3 characters")
    .max(100, "Guardian name must be under 100 characters"),
  guardianPhone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 digits")
    .max(20, "Phone number is too long")
    .regex(/^\+?[0-9\s()-]+$/, "Please enter a valid phone number"),
});

export type AdmissionFormData = z.infer<typeof admissionSchema>;

// ── Invoice Generation ──
export const invoiceSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  term: z.string().min(1, "Please select a term"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be greater than 0")
    .refine((v) => Number(v) <= 999999, "Amount cannot exceed $999,999"),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// ── Payment Recording ──
export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Please select an invoice"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be greater than 0"),
  method: z.string().min(1, "Please select a payment method"),
  reference: z.string().trim().max(64, "Reference must be under 64 characters").optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// File upload validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return "File must be under 5MB";
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) return "Only PDF, JPG, and PNG files are accepted";
  return null;
}
