import { describe, expect, it } from "vitest";
import { assertBalanced, buildMilestoneJournal } from "./ledger";

describe("milestone disbursement journal", () => {
  const terms = {
    grossKes: 1_250_000,
    retentionRate: 0.05,
    feeRate: 0.065,
    contractorWhtRate: 0.03,
  };

  it("always balances (property over a grid of realistic terms)", () => {
    for (const gross of [1, 999.99, 15_000_000, 123_456.78, 0.01]) {
      for (const retention of [0, 0.05, 0.075]) {
        for (const fee of [0.05, 0.065, 0.08]) {
          for (const wht of [0, 0.03]) {
            const lines = buildMilestoneJournal({
              grossKes: gross,
              retentionRate: retention,
              feeRate: fee,
              contractorWhtRate: wht,
            });
            expect(() => assertBalanced(lines)).not.toThrow();
          }
        }
      }
    }
  });

  it("splits the reference project correctly", () => {
    const lines = buildMilestoneJournal(terms);
    const byAccount = Object.fromEntries(
      lines.map((l) => [l.account, l.creditCents || -l.debitCents]),
    );
    expect(byAccount["project_account"]).toBe(-125_000_000); // Dr gross
    expect(byAccount["retention_held"]).toBe(6_250_000); // 5%
    expect(byAccount["msingi_fee_revenue"]).toBe(8_125_000); // 6.5%
    expect(byAccount["tax_withholding"]).toBe(3_750_000); // 3%
    expect(byAccount["contractor_payable"]).toBe(106_875_000); // remainder
  });

  it("rejects terms that zero out the contractor", () => {
    expect(() =>
      buildMilestoneJournal({
        grossKes: 100,
        retentionRate: 0.5,
        feeRate: 0.4,
        contractorWhtRate: 0.1,
      }),
    ).toThrow(/non-positive/);
  });

  it("rejects nonsense rates and amounts", () => {
    expect(() =>
      buildMilestoneJournal({ ...terms, grossKes: 0 }),
    ).toThrow();
    expect(() =>
      buildMilestoneJournal({ ...terms, feeRate: 1.2 }),
    ).toThrow(/out of range/);
  });
});
