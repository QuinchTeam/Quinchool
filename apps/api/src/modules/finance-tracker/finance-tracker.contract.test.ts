import * as assert from "node:assert/strict";
import { test } from "node:test";

import { transferSchema } from "./finance-tracker.contract";

const transfer = {
  fromWalletId: "cm123456789012345678901234",
  toWalletId: "cm223456789012345678901234",
  amount: "250.00",
  notes: "Move savings",
  occurredAt: "2026-09-15T08:00:00.000Z",
};

test("a transfer requires two different wallets", () => {
  const parsed = transferSchema.safeParse({
    ...transfer,
    toWalletId: transfer.fromWalletId,
  });

  assert.equal(parsed.success, false);
  if (parsed.success) assert.fail("Expected transfer validation to fail.");
  assert.match(parsed.error.issues[0]?.message ?? "", /different wallets/);
});

test("a valid transfer preserves its monetary amount", () => {
  const parsed = transferSchema.parse(transfer);

  assert.equal(parsed.amount, "250.00");
});
