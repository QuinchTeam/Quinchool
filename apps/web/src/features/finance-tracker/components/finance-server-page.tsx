import "server-only";

import { createHash } from "node:crypto";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { FinanceDashboard } from "./finance-dashboard";
import { FinanceScope } from "./shared/finance-scope";
import { TransactionHistory } from "./transaction-history";

// Fetch sections client-side so a slow endpoint does not block the whole page.
export async function FinanceServerPage({
  history = false,
}: {
  history?: boolean;
}) {
  // Hash the session to partition client caches without exposing the cookie.
  const session = getSessionCookie(await headers()) ?? "";
  const scope = createHash("sha256").update(session).digest("hex");

  return (
    <FinanceScope scope={scope}>
      {history ? <TransactionHistory /> : <FinanceDashboard />}
    </FinanceScope>
  );
}
