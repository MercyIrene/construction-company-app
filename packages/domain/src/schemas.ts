/**
 * Boundary validation schemas (docs/11 §2): every server action validates its
 * input with these. Shared client/server so forms and services agree.
 */

import { z } from "zod";

export const LEDGER_ACCOUNTS = [
  "project_account",
  "contractor_payable",
  "consultant_payable",
  "supplier_payable",
  "msingi_fee_revenue",
  "retention_held",
  "tax_withholding",
  "adjustment",
] as const;
export type LedgerAccount = (typeof LEDGER_ACCOUNTS)[number];

export const KENYA_COUNTIES_PILOT = [
  "Nairobi",
  "Kiambu",
  "Kajiado",
  "Machakos",
] as const;

export const createProjectSchema = z.object({
  name: z.string().min(3).max(120),
  ownerName: z.string().min(2).max(120),
  ownerEmail: z.string().email(),
  county: z.string().min(2).max(60),
  siteLabel: z.string().min(2).max(120),
  parcelNo: z.string().max(60).optional().or(z.literal("")),
  constructionValueKes: z.coerce.number().positive().max(500_000_000),
  feePercent: z.coerce.number().min(4).max(10).default(6.5),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const addMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(3).max(160),
  description: z.string().max(2000).optional().or(z.literal("")),
  valueKes: z.coerce.number().positive(),
  isHoldPoint: z.coerce.boolean().default(false),
  plannedStart: z.string().date().optional().or(z.literal("")),
  plannedEnd: z.string().date().optional().or(z.literal("")),
});
export type AddMilestoneInput = z.infer<typeof addMilestoneSchema>;

export const registerEvidenceSchema = z.object({
  projectId: z.string().uuid(),
  storagePath: z.string().min(1),
  mediaType: z.string().min(3).max(100),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  capturedAt: z.string().datetime().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});
export type RegisterEvidenceInput = z.infer<typeof registerEvidenceSchema>;

export const approveMilestoneSchema = z.object({
  milestoneId: z.string().uuid(),
  /** Version of the evidence pack the approver reviewed (threat T3 binding). */
  packVersion: z.coerce.number().int().positive(),
});
export type ApproveMilestoneInput = z.infer<typeof approveMilestoneSchema>;
