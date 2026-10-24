"use client";

import { Card } from "@/components/ui/card";
import { FormErrors } from "@/components/shared/form-errors";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";
import { ErrorState } from "@/components/shared/error-state";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { AppIcon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { EducationEditor } from "@/features/career-profile/components/education-editor";
import { EntryList } from "@/features/career-profile/components/entry-list";
import { ExperienceEditor } from "@/features/career-profile/components/experience-editor";
import { ProjectEditor } from "@/features/career-profile/components/project-editor";
import { SkillGroupEditor } from "@/features/career-profile/components/skill-group-editor";
import { CareerProfileField as Field } from "@/features/career-profile/components/career-profile-field";
import { useCareerProfileForm } from "@/features/career-profile/hooks/use-career-profile-form";
import {
  emptyEducation,
  emptyExperience,
  emptyProject,
  emptySkillGroup,
} from "@/features/career-profile/lib/empty-career-profile";
import {
  validationFieldLabel,
  validationMessages,
} from "@/features/career-profile/lib/validation-errors";

export function CareerProfileForm() {
  const { form, error, isLoading, isSaving, onSubmit, refetch } =
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

  if (error) {
    return <ErrorState error={error} retry={() => void refetch()} />;
  }

  return (
    <Form {...form}>
      <form className="grid gap-10" noValidate onSubmit={onSubmit}>
        <FormErrors
          errors={errorMessages.map((message) => {
            const [path, ...rest] = message.split(": ");
            return {
              label: validationFieldLabel(path),
              message: rest.join(": "),
            };
          })}
        />
        <Card variant="minimal" className="gap-6">
          <h2 className="text-lg font-semibold">Personal details</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Name"
              name="name"
              autoComplete="name"
              placeholder="Juan Dela Cruz"
              required
            />
            <Field
              label="Email"
              name="email"
              variant="email"
              placeholder="juan@example.com"
              autoComplete="email"
              required
            />
            <Field
              label="Contact number"
              name="contactNumber"
              variant="phone"
              placeholder="+63 912 345 6789"
              autoComplete="tel"
              required
            />
            <Field
              label="LinkedIn"
              name="linkedin"
              variant="link"
              placeholder="linkedin.com/in/juandelacruz"
              autoComplete="url"
              optional
            />
            <Field
              label="GitHub"
              name="github"
              variant="link"
              placeholder="github.com/juandelacruz"
              optional
            />
            <Field
              label="Personal website"
              name="personalWebsite"
              variant="link"
              placeholder="juandelacruz.dev"
              optional
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
            <AppIcon icon={InfoIcon} className="size-5 shrink-0" />
            <p>
              Education, skills, experiences, and projects are optional. Add
              them now or save your personal details and return later. Complete
              or remove any entries you add before saving.
            </p>
          </div>
        </Card>

        <EntryList
          name="educations"
          title="Education"
          itemLabel="Education"
          addLabel="Add education"
          empty={emptyEducation}
          renderItem={(index) => <EducationEditor index={index} />}
        />

        <EntryList
          name="skillGroups"
          title="Skills"
          itemLabel="Skill group"
          addLabel="Add skill group"
          empty={emptySkillGroup}
          renderItem={(index) => <SkillGroupEditor index={index} />}
        />

        <EntryList
          name="experiences"
          title="Experiences"
          itemLabel="Experience"
          addLabel="Add experience"
          empty={emptyExperience}
          renderItem={(index) => <ExperienceEditor index={index} />}
        />

        <EntryList
          name="projects"
          title="Projects"
          itemLabel="Project"
          addLabel="Add project"
          empty={emptyProject}
          renderItem={(index) => <ProjectEditor index={index} />}
        />

        <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end border-t bg-card/95 px-6 py-4 supports-[backdrop-filter]:backdrop-blur">
          <Button type="submit" disabled={isSaving}>
            <AppIcon icon={FloppyDiskIcon} />
            {isSaving ? "Saving..." : "Save career profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
