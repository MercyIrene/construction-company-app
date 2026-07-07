/**
 * Disbursement journal builder (docs/05 §5, ADR-0005).
 *
 * Given a certified milestone value and the project's commercial terms,
 * produce the balanced double-entry journal for one milestone disbursement:
 *
 *   Dr project_account            gross
 *   Cr contractor_payable         gross - retention - fee - wht
 *   Cr retention_held             retention
 *   Cr msingi_fee_revenue         fee (net of any WHT withheld on our fee)
 *   Cr tax_withholding            wht amounts
 *
 * All arithmetic in integer cents to avoid float drift; inputs/outputs are
 * KES decimal strings at the boundary.
 */

import type { LedgerAccount } from "./schemas";

export interface DisbursementTerms {
  /** Certified milestone value, KES. */
  grossKes: number;
  /** Retention withheld from the contractor, e.g. 0.05. */
  retentionRate: number;
  /** Msingi delivery fee rate applied to certified value, e.g. 0.065. */
  feeRate: number;
  /**
   * Withholding tax rate on the contractor payment (contractor WHT, e.g. 0.03
   * for resident contractors). Computed on gross per KRA practice.
   */
  contractorWhtRate: number;
}

export interface JournalLine {
  account: LedgerAccount;
  debitCents: number;
  creditCents: number;
  memo: string;
}

const toCents = (kes: number): number => Math.round(kes * 100);

export function buildMilestoneJournal(terms: DisbursementTerms): JournalLine[] {
  if (terms.grossKes <= 0) throw new Error("gross must be positive");
  for (const [k, v] of Object.entries({
    retentionRate: terms.retentionRate,
    feeRate: terms.feeRate,
    contractorWhtRate: terms.contractorWhtRate,
  })) {
    if (v < 0 || v >= 1) throw new Error(`${k} out of range [0,1): ${v}`);
  }

  const gross = toCents(terms.grossKes);
  const retention = Math.round(gross * terms.retentionRate);
  const fee = Math.round(gross * terms.feeRate);
  const wht = Math.round(gross * terms.contractorWhtRate);
  const contractorNet = gross - retention - fee - wht;
  if (contractorNet <= 0) {
    throw new Error("terms leave contractor with a non-positive payment");
  }

  const allLines: JournalLine[] = [
    {
      account: "project_account",
      debitCents: gross,
      creditCents: 0,
      memo: "Milestone disbursement from project account",
    },
    {
      account: "contractor_payable",
      debitCents: 0,
      creditCents: contractorNet,
      memo: "Contractor payment (net of retention, fee, WHT)",
    },
    {
      account: "retention_held",
      debitCents: 0,
      creditCents: retention,
      memo: "Retention withheld",
    },
    {
      account: "msingi_fee_revenue",
      debitCents: 0,
      creditCents: fee,
      memo: "Msingi delivery fee tranche",
    },
    {
      account: "tax_withholding",
      debitCents: 0,
      creditCents: wht,
      memo: "Contractor WHT withheld for remittance",
    },
  ];
  const lines = allLines.filter((l) => l.debitCents > 0 || l.creditCents > 0);

  assertBalanced(lines);
  return lines;
}

export function assertBalanced(lines: readonly JournalLine[]): void {
  const debits = lines.reduce((s, l) => s + l.debitCents, 0);
  const credits = lines.reduce((s, l) => s + l.creditCents, 0);
  if (debits !== credits) {
    throw new Error(`journal does not balance: Dr ${debits} ≠ Cr ${credits}`);
  }
}

export const centsToKes = (cents: number): number => cents / 100;
