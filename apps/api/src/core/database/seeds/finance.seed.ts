// Local-only: seed:finance [user-email] replaces finance data; defaults to the oldest user.
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../../config/env";
import { PrismaClient } from "../../../generated/prisma/client";

type Type = "INCOME" | "EXPENSE";
type WalletKey = "bank" | "ewallet" | "cash";
interface Entry {
  wallet: WalletKey;
  type: Type;
  label: string;
  amount: number;
  at: Date;
  notes?: string;
}

const WALLETS = {
  bank: {
    name: "BPI Savings",
    type: "TRADITIONAL_BANK",
    color: "#2ec4b6",
    openingBalance: "48500.00",
  },
  ewallet: {
    name: "GCash",
    type: "EWALLET",
    color: "#3b82f6",
    openingBalance: "3200.00",
  },
  cash: {
    name: "Cash",
    type: "CASH",
    color: "#f59e0b",
    openingBalance: "2500.00",
  },
} as const;

// Keep fixture history deterministic between runs.
let state = 20260101;
function random() {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
}
const between = (min: number, max: number) => min + random() * (max - min);
const peso = (min: number, max: number, step = 1) =>
  Math.round(between(min, max) / step) * step;
const pick = <T>(items: readonly T[]) =>
  items[Math.floor(random() * items.length)];

// Manila is UTC+8 with no daylight saving time.
function manila(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
) {
  return new Date(Date.UTC(year, month, day, hour - 8, minute));
}

function buildEntries(now: Date): Entry[] {
  const entries: Entry[] = [];
  const add = (entry: Entry) => {
    if (entry.at <= now) entries.push(entry);
  };
  const transfer = (
    from: WalletKey,
    to: WalletKey,
    amount: number,
    at: Date,
    notes?: string,
  ) => {
    add({
      wallet: from,
      type: "EXPENSE",
      label: `Transfer to ${WALLETS[to].name}`,
      amount,
      at,
      notes,
    });
    add({
      wallet: to,
      type: "INCOME",
      label: `Transfer from ${WALLETS[from].name}`,
      amount,
      at,
      notes,
    });
  };

  const year = now.getUTCFullYear();
  for (let month = 0; month <= 11; month++) {
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const lastDay = (day: number) => Math.min(day, days);

    add({
      wallet: "bank",
      type: "INCOME",
      label: "Salary",
      amount: 32500,
      at: manila(year, month, 15, 9),
      notes: "1st half payroll",
    });
    add({
      wallet: "bank",
      type: "INCOME",
      label: "Salary",
      amount: 32500,
      at: manila(year, month, lastDay(30), 9),
      notes: "2nd half payroll",
    });
    transfer(
      "bank",
      "ewallet",
      4000,
      manila(year, month, 16, 10, 15),
      "Cash-in for bills",
    );
    transfer(
      "bank",
      "cash",
      3500,
      manila(year, month, 2, 18, 40),
      "ATM withdrawal",
    );
    transfer(
      "bank",
      "cash",
      3500,
      manila(year, month, 17, 18, 20),
      "ATM withdrawal",
    );

    add({
      wallet: "bank",
      type: "EXPENSE",
      label: "Rent",
      amount: 15000,
      at: manila(year, month, 5, 8),
      notes: "Condo unit",
    });
    add({
      wallet: "ewallet",
      type: "EXPENSE",
      label: "Electricity",
      amount: peso(2400, 4300, 5),
      at: manila(year, month, 18, 20),
      notes: "Meralco",
    });
    add({
      wallet: "ewallet",
      type: "EXPENSE",
      label: "Internet",
      amount: 1699,
      at: manila(year, month, 20, 21),
      notes: "PLDT Fiber",
    });
    add({
      wallet: "ewallet",
      type: "EXPENSE",
      label: "Water",
      amount: peso(380, 720, 5),
      at: manila(year, month, 22, 19),
      notes: "Manila Water",
    });
    add({
      wallet: "ewallet",
      type: "EXPENSE",
      label: "Mobile Load",
      amount: 599,
      at: manila(year, month, 3, 12),
    });
    add({
      wallet: "ewallet",
      type: "EXPENSE",
      label: "Subscriptions",
      amount: 549,
      at: manila(year, month, 8, 0, 5),
      notes: "Netflix",
    });
    add({
      wallet: "ewallet",
      type: "EXPENSE",
      label: "Subscriptions",
      amount: 194,
      at: manila(year, month, 12, 0, 5),
      notes: "Spotify",
    });

    if (random() < 0.7) {
      add({
        wallet: "ewallet",
        type: "INCOME",
        label: "Freelance",
        amount: peso(4500, 18000, 500),
        at: manila(year, month, Math.floor(between(6, 26)), 14),
        notes: pick([
          "Landing page build",
          "Logo revisions",
          "Bug fixes for client",
          "Website maintenance",
        ]),
      });
    }

    for (let day = 1; day <= days; day++) {
      const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
      const workday = weekday >= 1 && weekday <= 5;
      if (workday) {
        add({
          wallet: pick(["cash", "ewallet"] as const),
          type: "EXPENSE",
          label: "Transportation",
          amount: peso(60, 260, 5),
          at: manila(year, month, day, 7, Math.floor(between(30, 59))),
          notes: pick(["Jeep + MRT", "Grab to office", "Angkas", "Bus"]),
        });
        add({
          wallet: "cash",
          type: "EXPENSE",
          label: "Food & Dining",
          amount: peso(120, 320, 5),
          at: manila(year, month, day, 12, Math.floor(between(0, 45))),
          notes: "Lunch",
        });
      }
      if (random() < 0.35) {
        add({
          wallet: "ewallet",
          type: "EXPENSE",
          label: "Coffee",
          amount: peso(140, 220, 5),
          at: manila(year, month, day, 15, Math.floor(between(0, 59))),
          notes: pick(["Starbucks", "Tim Hortons", "Local cafe"]),
        });
      }
      if (weekday === 6) {
        add({
          wallet: "bank",
          type: "EXPENSE",
          label: "Groceries",
          amount: peso(1800, 3600, 10),
          at: manila(year, month, day, 10, 30),
          notes: pick(["SM Supermarket", "Puregold", "S&R"]),
        });
      }
      if (weekday === 0 && random() < 0.6) {
        add({
          wallet: pick(["bank", "ewallet"] as const),
          type: "EXPENSE",
          label: "Food & Dining",
          amount: peso(600, 2200, 10),
          at: manila(year, month, day, 19),
          notes: pick(["Dinner out", "Samgyup with friends", "Family lunch"]),
        });
      }
      if (random() < 0.05) {
        add({
          wallet: "bank",
          type: "EXPENSE",
          label: "Shopping",
          amount: peso(800, 4500, 50),
          at: manila(year, month, day, 16),
          notes: pick(["Shopee order", "Lazada order", "Uniqlo"]),
        });
      }
    }

    if (month === 3)
      add({
        wallet: "bank",
        type: "EXPENSE",
        label: "Travel",
        amount: 12800,
        at: manila(year, month, 10, 9),
        notes: "Holy Week trip to Baguio",
      });
    if (month === 5)
      add({
        wallet: "bank",
        type: "EXPENSE",
        label: "Health",
        amount: 2350,
        at: manila(year, month, 21, 11),
        notes: "Annual check-up",
      });
    if (month === 8)
      add({
        wallet: "bank",
        type: "INCOME",
        label: "Bonus",
        amount: 15000,
        at: manila(year, month, 25, 9),
        notes: "Performance bonus",
      });
  }
  return entries;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed finance fixtures in production.");
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  try {
    const email = process.argv[2];
    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!user)
      throw new Error(
        email ? `No user with email ${email}.` : "No users yet. Sign up first.",
      );

    const entries = buildEntries(new Date());
    await prisma.$transaction(
      async (db) => {
        // Delete transactions first because their wallet and label references are restricted.
        await db.financeTransaction.deleteMany({ where: { userId: user.id } });
        await db.financeWallet.deleteMany({ where: { userId: user.id } });
        await db.financeLabel.deleteMany({ where: { userId: user.id } });

        const wallets = {} as Record<WalletKey, string>;
        for (const [sortOrder, key] of (
          ["bank", "ewallet", "cash"] as const
        ).entries()) {
          const wallet = await db.financeWallet.create({
            data: { ...WALLETS[key], userId: user.id, sortOrder },
          });
          wallets[key] = wallet.id;
        }

        const labelKey = (type: Type, name: string) =>
          `${type}:${name.toLowerCase()}`;
        const labels = new Map(
          entries.map((e) => [
            labelKey(e.type, e.label),
            { type: e.type, name: e.label },
          ]),
        );
        await db.financeLabel.createMany({
          data: [...labels.values()].map((label) => ({
            ...label,
            userId: user.id,
            normalizedName: label.name.toLowerCase(),
          })),
        });
        const labelIds = new Map(
          (await db.financeLabel.findMany({ where: { userId: user.id } })).map(
            (l) => [labelKey(l.type, l.name), l.id],
          ),
        );

        await db.financeTransaction.createMany({
          data: entries.map((e) => ({
            userId: user.id,
            walletId: wallets[e.wallet],
            labelId: labelIds.get(labelKey(e.type, e.label))!,
            type: e.type,
            amount: e.amount.toFixed(2),
            notes: e.notes ?? null,
            occurredAt: e.at,
          })),
        });
      },
      { timeout: 60_000 },
    );
    console.log(
      `Seeded 3 wallets and ${entries.length} transactions for ${user.email}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
