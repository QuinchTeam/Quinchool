# Resume Builder

## Context
This is not a fully pledge builder, that export resume, it's more of a tool that help me build resume bullets on my existing resume on Overleaf for a specific job requirement.

## Problem
I am a 1 year of experience full-stack engineer, I contributed on frontend, backend, and devops. With that I am able to build so many skills that It can't fit all anymore on 1 page resume. So I generalized my resume and just nitpick the strongest, but that cause a problem where in a specific job, I will miss some job requirement that is written that I may have obtain but didn't written on my general resume. So the screening on that job, I might not pass. So I decided to now tailor my resume to the job description, but the problem is I need to rethink again, about that skill so It consume my task.

## Solution
Create a List of resume bullet experiences for each company here in Resume Builder Page. Store each, each bullet experience is assigned on 1 company. Fetch all experiences bullet, passed them on our text-generation api. Create a RESUME-BUILDER prompt.

RESUME-BUILDER prompt:
The prompt should tell the AI LLM to READ the given Job Requirement, then it will rank all the given experiences bullet separated by company, so company 1 has its own ranking while company 2 has too, and not a combined rankings. Ranking process should have a criteria, for RELEVANT, IMPACT, and POWER it gives. Out of all experience bullet as i say, it should give top 10 only for each company. It result/reply should be like:

```
Company: PioneerDevAI

\item Delivered full-stack features across user interfaces, backend APIs, database models, background jobs, and third-party AI integrations throughout the software development lifecycle.
\item Designed reusable React and Tailwind CSS interfaces for complex workflows, including a node-based canvas, conversational workspace, multi-step forms, and complete loading, error, and empty states.

Company: AppQuant

\item Independently designed, built, and maintained a multi-tenant SaaS CRM using Next.js, TypeScript, Node.js, PostgreSQL, Prisma, Supabase, and Vercel.
\item Translated business and product requirements into scalable technical solutions across payments, communications, AI workflows, automation, and database architecture.

```

Strictly like that.

## UI Plan
Section 1
Minimal UI Plan, Below the Resume Builder text on the page, Add a Card that contain:
- Same Text Model Selector UI presented on text generation page. We should now make the Text Model Selector component into its own file. Should take the label and the actual selector. This component should return the modelId, thats it when we re-use this component. This way, we dont duplicate this ui component to 2 page, and avoid implementation diff.
- Button to execute a new api, "/api/build-resume". Passed modelId, resumeExperiences, return the generated result. Uses existing generateText service function since that has the provider chain logic.
- Display result in a block.
Section 2
- Input with label "Company Name"
- Textarea with label "Experience"
- Submit Button to execute a new api, "/api/resume-bullet"
Section 3 
- List all Experiences with label of Company Name

## Database Plan
- Create a Prisma model ResumeBullet. id uuid, companyName string, Experience string, createdAt, updatedAt


## Deps
- Shadcn UI
- Tanstack Query [New]
- 