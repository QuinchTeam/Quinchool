import "server-only";

import { createHash } from "node:crypto";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { FinanceDashboard } from "./finance-dashboard";
import { FinanceScope } from "./shared/finance-scope";
import { TransactionHistory } from "./transaction-history";

/**
 * Renders instantly: no data is awaited here. Each section runs its own query
 * on the client, so a slow endpoint only delays its own section.
 */
export async function FinanceServerPage({
  history = false,
}: {
  history?: boolean;
}) {
  // A hash of the session cookie scopes the query cache per login without a
  // round trip for the user id, and never exposes the cookie to client JS.
  const session = getSessionCookie(await headers()) ?? "";
  const scope = createHash("sha256").update(session).digest("hex");

  return (
    <FinanceScope scope={scope}>
      {history ? <TransactionHistory /> : <FinanceDashboard />}
    </FinanceScope>
  );
}
