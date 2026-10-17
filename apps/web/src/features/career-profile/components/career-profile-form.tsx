"use client";

import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { AppIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EducationEditor,
  EntryList,
  ExperienceEditor,
  ProjectEditor,
  SkillGroupEditor,
} from "@/features/career-profile/components/career-profile-entries";
import { CareerProfileField as Field } from "@/features/career-profile/components/career-profile-field";
import { useCareerProfileForm } from "@/features/career-profile/hooks/use-career-profile-form";
import {
  emptyEducation,
  emptyExperience,
  emptyProject,
  emptySkillGroup,
} from "@/features/career-profile/lib/empty-career-profile";
import { validationMessages } from "@/features/career-profile/lib/validation-errors";

export function CareerProfileForm() {
  const { form, isError, isLoading, isSaving, onSubmit, refetch } =
    useCareerProfileForm();
  const errorMessages = form.formState.submitCount
    ? validationMessages(form.formState.errors)
    : [];

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-md border border-dashed p-4">
        <p className="text-sm text-muted-foreground">
          Could not load the career profile.
        </p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="grid gap-10" noValidate onSubmit={onSubmit}>
        {errorMessages.length > 0 && (
          <div
            role="alert"
            className="rounded-md border border-destructive p-4 text-sm text-destructive"
          >
            <p>Fix these fields before saving:</p>
            <ul className="list-disc pl-5">
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        <section className="grid gap-6">
          <h2 className="text-lg font-semibold">Personal details</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Name" name="name" autoComplete="name" required />
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            <Field
              label="Contact number"
              name="contactNumber"
              type="tel"
              autoComplete="tel"
              required
            />
            <Field
              label="LinkedIn"
              name="linkedin"
              inputMode="url"
              autoComplete="url"
              optional
            />
            <Field label="GitHub" name="github" inputMode="url" optional />
            <Field
              label="Personal website"
              name="personalWebsite"
              inputMode="url"
              optional
            />
          </div>
        </section>

        <Separator />

        <p className="text-sm text-muted-foreground">
          Education, skills, experiences, and projects are optional. Add them
          now or save your personal details and return later. Complete or remove
          any entries you add before saving.
        </p>

        <EntryList
          name="educations"
          title="Education"
          itemLabel="Education"
          addLabel="Add education"
          empty={emptyEducation}
          renderItem={(index) => <EducationEditor index={index} />}
        />

        <Separator />

        <EntryList
          name="skillGroups"
          title="Skills"
          itemLabel="Skill group"
          addLabel="Add skill group"
          empty={emptySkillGroup}
          renderItem={(index) => <SkillGroupEditor index={index} />}
        />

        <Separator />

        <EntryList
          name="experiences"
          title="Experiences"
          itemLabel="Experience"
          addLabel="Add experience"
          empty={emptyExperience}
          renderItem={(index) => <ExperienceEditor index={index} />}
        />

        <Separator />

        <EntryList
          name="projects"
          title="Projects"
          itemLabel="Project"
          addLabel="Add project"
          empty={emptyProject}
          renderItem={(index) => <ProjectEditor index={index} />}
        />

        <div className="sticky bottom-0 flex justify-end border-t bg-background/95 py-4 supports-[backdrop-filter]:backdrop-blur">
          <Button type="submit" disabled={isSaving}>
            <AppIcon icon={FloppyDiskIcon} />
            {isSaving ? "Saving..." : "Save career profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
