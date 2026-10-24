// Local-only: seed:jobs-scraper [user-email] replaces the scan criteria; defaults to the oldest user.
import {
  type JobScraperConfig,
  jobScraperConfigSchema,
} from "../../../modules/jobs-scraper/jobs-scraper.contract";
import { JobsScraperRepository } from "../../../modules/jobs-scraper/jobs-scraper.repository";
import { PrismaService } from "../prisma/prisma.service";

const CONFIG: JobScraperConfig = {
  roles: [
    "Software Developer",
    "Full Stack Developer",
    "Software Engineer",
    "Full Stack Engineer",
  ],
  includedLevels: ["Entry", "Junior", "Mid"],
  requiredTechnologies: [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Express",
    "NestJS",
    "FastAPI",
    "AI",
    "LLM",
    "PostgreSQL",
    "MySQL",
    "SQL",
  ],
  excludedLevels: [
    "Senior",
    "Sr",
    "Lead",
    "Manager",
    "Staff",
    "Principal",
    "Director",
    "Head",
    "CTO",
  ],
  excludedTechnologies: [
    "C#",
    ".NET",
    "dotnet",
    "Java",
    "OOP",
    "object-oriented programming",
    "NoSQL",
    "MongoDB",
    "DynamoDB",
    "Cassandra",
    "Firestore",
    "Cosmos DB",
    "Neo4j",
    "Redis",
  ],
  sources: ["LinkedIn", "JobStreet"],
  timeRange: "TODAY",
  customStartDate: null,
  customEndDate: null,
  worldwideWorkModes: ["Remote"],
  philippinesWorkModes: ["Remote", "Hybrid"],
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed jobs scraper fixtures in production.");
  }
  const prisma = new PrismaService();
  try {
    const email = process.argv[2];
    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!user)
      throw new Error(
        email ? `No user with email ${email}.` : "No users yet. Sign up first.",
      );

    // Parse through the API contract so the fixture can never drift from what the app accepts.
    const config = jobScraperConfigSchema.parse(CONFIG);
    await new JobsScraperRepository(prisma).saveConfig(user.id, config);
    console.log(`Seeded jobs scraper criteria for ${user.email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
