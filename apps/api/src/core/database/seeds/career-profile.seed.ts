// Local-only: seed:career-profile [user-email] replaces the career profile; defaults to the oldest user.
import {
  type CareerProfileValues,
  careerProfileSchema,
} from "../../../modules/career-profile/career-profile.contract";
import { CareerProfileRepository } from "../../../modules/career-profile/career-profile.repository";
import { PrismaService } from "../prisma/prisma.service";

const bullets = (...texts: string[]) => texts.map((text) => ({ text }));

const PROFILE: Omit<CareerProfileValues, "email"> = {
  name: "Juan Miguel Dela Cruz",
  contactNumber: "+63 917 555 0142",
  linkedin: "https://www.linkedin.com/in/juanmigueldelacruz",
  github: "https://github.com/jmdelacruz",
  personalWebsite: "https://jmdelacruz.dev",
  educations: [
    {
      institutionName: "Polytechnic University of the Philippines",
      location: "Sta. Mesa, Manila",
      degree: "Bachelor of Science",
      fieldOfStudy: "Information Technology",
      specialization: "Web and Mobile Application Development",
      startDate: "2016-08",
      endDate: "2020-07",
    },
  ],
  skillGroups: [
    {
      label: "Languages",
      skills: ["TypeScript", "JavaScript", "Python", "SQL", "HTML", "CSS"],
    },
    {
      label: "Frontend",
      skills: [
        "React",
        "Next.js",
        "Tailwind CSS",
        "TanStack Query",
        "React Hook Form",
        "Zod",
      ],
    },
    {
      label: "Backend",
      skills: [
        "Node.js",
        "NestJS",
        "Express",
        "FastAPI",
        "Prisma",
        "REST APIs",
      ],
    },
    {
      label: "Databases & Cloud",
      skills: [
        "PostgreSQL",
        "Redis",
        "Docker",
        "Google Cloud Run",
        "AWS S3",
        "GitHub Actions",
      ],
    },
    {
      label: "Testing & Tools",
      skills: ["Vitest", "Jest", "Playwright", "Git", "Figma", "Sentry"],
    },
  ],
  experiences: [
    {
      jobTitle: "Software Engineer",
      companyName: "Kalibrr",
      location: "Makati City, Philippines",
      employmentType: "Full-time",
      isCurrent: true,
      startDate: "2023-03",
      endDate: "",
      skills: [
        "TypeScript",
        "Next.js",
        "React",
        "TanStack Query",
        "NestJS",
        "PostgreSQL",
        "Redis",
        "Playwright",
      ],
      bullets: bullets(
        "Led the rebuild of the employer job-posting flow in Next.js, cutting median time to publish a listing from 11 to 4 minutes.",
        "Designed a NestJS service for candidate search filters backed by PostgreSQL indexes and Redis caching, reducing p95 latency from 1.8s to 420ms.",
        "Introduced Playwright end-to-end tests for hiring-critical paths, dropping production regressions per release by about 60%.",
        "Mentored 3 junior engineers through code reviews and weekly pairing sessions.",
      ),
    },
    {
      jobTitle: "Full Stack Developer",
      companyName: "Sprout Solutions",
      location: "Pasig City, Philippines",
      employmentType: "Full-time",
      isCurrent: false,
      startDate: "2020-09",
      endDate: "2023-02",
      skills: [
        "JavaScript",
        "React",
        "Node.js",
        "Express",
        "PostgreSQL",
        "Docker",
        "Jest",
      ],
      bullets: bullets(
        "Built payroll and leave-management screens in React used by 1,200+ client companies.",
        "Developed Express APIs for government contribution reports (SSS, PhilHealth, Pag-IBIG), automating a previously manual monthly process.",
        "Containerized 4 legacy services with Docker, standardizing local setup and cutting onboarding time from 3 days to half a day.",
        "Raised unit test coverage of the payroll computation module from 35% to 82% with Jest.",
      ),
    },
    {
      jobTitle: "Web Developer Intern",
      companyName: "Accenture Philippines",
      location: "Taguig City, Philippines",
      employmentType: "Internship",
      isCurrent: false,
      startDate: "2020-01",
      endDate: "2020-05",
      skills: ["JavaScript", "HTML", "CSS", "SQL"],
      bullets: bullets(
        "Built internal dashboard pages for tracking project resource allocation.",
        "Wrote SQL reports that replaced spreadsheet-based weekly utilization tracking.",
      ),
    },
  ],
  projects: [
    {
      projectName: "Pera Tracker — Personal Finance App",
      isCurrent: true,
      startDate: "2024-06",
      endDate: "",
      skills: [
        "Next.js",
        "TypeScript",
        "NestJS",
        "Prisma",
        "PostgreSQL",
        "Google Cloud Run",
        "GitHub Actions",
      ],
      bullets: bullets(
        "Built a multi-wallet budgeting app with Next.js and NestJS, tracking cash, e-wallet, and bank balances in one place.",
        "Deployed to Google Cloud Run through GitHub Actions with zero-downtime releases.",
        "Added monthly cash-flow charts and category breakdowns used by 150+ beta users.",
      ),
    },
    {
      projectName: "JobHunt PH — Job Listing Aggregator",
      isCurrent: false,
      startDate: "2023-08",
      endDate: "2024-02",
      skills: ["Python", "FastAPI", "PostgreSQL", "React", "Docker"],
      bullets: bullets(
        "Aggregated developer job listings from multiple Philippine job boards into one searchable feed.",
        "Built a FastAPI backend with deduplication that merged repeated postings across sources.",
      ),
    },
    {
      projectName: "Barangay Health Records System (Capstone)",
      isCurrent: false,
      startDate: "2019-08",
      endDate: "2020-05",
      skills: ["JavaScript", "Node.js", "Express", "SQL"],
      bullets: bullets(
        "Digitized patient records for a barangay health center serving 3,000+ residents.",
        "Received the Best Capstone Project award in the IT department.",
      ),
    },
  ],
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed career profile fixtures in production.");
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
    const values = careerProfileSchema.parse({ ...PROFILE, email: user.email });
    await new CareerProfileRepository(prisma).save(user.id, values);
    console.log(`Seeded career profile for ${user.email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
