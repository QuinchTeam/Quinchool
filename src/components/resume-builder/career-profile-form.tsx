"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  FloppyDiskIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useId, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCareerProfile } from "@/hooks/use-career-profile";
import {
  type CareerProfileValues,
  careerProfileSchema,
} from "@/lib/validations/career-profile";

const emptyEducation = (): CareerProfileValues["educations"][number] => ({
  institutionName: "",
  location: "",
  degree: "",
  fieldOfStudy: "",
  specialization: "",
  startDate: "",
  endDate: "",
});

const emptySkillGroup = (): CareerProfileValues["skillGroups"][number] => ({
  label: "",
  skills: [],
});

const emptyExperience = (): CareerProfileValues["experiences"][number] => ({
  jobTitle: "",
  companyName: "",
  location: "",
  employmentType: "",
  skills: [],
  bullets: [{ text: "" }],
  isCurrent: false,
  startDate: "",
  endDate: "",
});

const emptyProject = (): CareerProfileValues["projects"][number] => ({
  projectName: "",
  skills: [],
  bullets: [{ text: "" }],
  isCurrent: false,
  startDate: "",
  endDate: "",
});

const emptyCareerProfile = (): CareerProfileValues => ({
  name: "",
  email: "",
  contactNumber: "",
  linkedin: "",
  github: "",
  personalWebsite: "",
  educations: [emptyEducation()],
  skillGroups: [emptySkillGroup()],
  experiences: [emptyExperience()],
  projects: [],
});

function Field({
  children,
  htmlFor,
  label,
  optional = false,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </Label>
      {children}
    </div>
  );
}

function SectionHeader({
  actionLabel,
  onAdd,
  title,
}: {
  actionLabel: string;
  onAdd: () => void;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
        {actionLabel}
      </Button>
    </div>
  );
}

function ItemHeader({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold">{label}</h3>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
        <span className="sr-only">Remove {label.toLowerCase()}</span>
      </Button>
    </div>
  );
}

function StringListInput({
  allowedValues,
  ariaLabel,
  invalid,
  onChange,
  placeholder,
  value,
}: {
  allowedValues?: string[];
  ariaLabel: string;
  invalid?: boolean;
  onChange: (value: string[]) => void;
  placeholder: string;
  value: string[];
}) {
  const [draft, setDraft] = useState("");
  const suggestionsId = useId();

  function addValues(input: string) {
    const additions = input
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!additions.length) {
      return;
    }

    const next = [...value];

    for (const addition of additions) {
      const canonicalValue = allowedValues?.find(
        (allowedValue) =>
          allowedValue.toLocaleLowerCase() === addition.toLocaleLowerCase(),
      );

      if (allowedValues && !canonicalValue) {
        toast.error(`Add "${addition}" to a skill group first`);
        continue;
      }

      const entry = canonicalValue ?? addition;

      if (
        !next.some(
          (existing) =>
            existing.toLocaleLowerCase() === entry.toLocaleLowerCase(),
        )
      ) {
        next.push(entry);
      }
    }

    onChange(next);
    setDraft("");
  }

  return (
    <>
      <div
        className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 shadow-xs has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20"
        aria-invalid={invalid || undefined}
      >
        {value.map((entry) => (
          <span
            key={entry}
            className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium"
          >
            {entry}
            <button
              type="button"
              className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() =>
                onChange(value.filter((candidate) => candidate !== entry))
              }
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="size-3"
              />
              <span className="sr-only">Remove {entry}</span>
            </button>
          </span>
        ))}
        <input
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label={ariaLabel}
          list={allowedValues ? suggestionsId : undefined}
          placeholder={value.length ? "" : placeholder}
          value={draft}
          onBlur={() => addValues(draft)}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addValues(draft);
            }
          }}
        />
      </div>
      {allowedValues && (
        <datalist id={suggestionsId}>
          {allowedValues.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
    </>
  );
}

function EducationEditor({
  index,
  onRemove,
}: {
  index: number;
  onRemove: () => void;
}) {
  const { register } = useFormContext<CareerProfileValues>();

  return (
    <div className="grid gap-5 rounded-md border p-5">
      <ItemHeader label={`Education ${index + 1}`} onRemove={onRemove} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          htmlFor={`education-${index}-institution`}
          label="Institution name"
        >
          <Input
            id={`education-${index}-institution`}
            required
            {...register(`educations.${index}.institutionName`)}
          />
        </Field>
        <Field htmlFor={`education-${index}-location`} label="Location">
          <Input
            id={`education-${index}-location`}
            required
            {...register(`educations.${index}.location`)}
          />
        </Field>
        <Field htmlFor={`education-${index}-degree`} label="Degree">
          <Input
            id={`education-${index}-degree`}
            required
            {...register(`educations.${index}.degree`)}
          />
        </Field>
        <Field htmlFor={`education-${index}-field`} label="Field of study">
          <Input
            id={`education-${index}-field`}
            required
            {...register(`educations.${index}.fieldOfStudy`)}
          />
        </Field>
        <Field
          htmlFor={`education-${index}-specialization`}
          label="Specialization"
          optional
        >
          <Input
            id={`education-${index}-specialization`}
            {...register(`educations.${index}.specialization`)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field htmlFor={`education-${index}-start`} label="Start date">
            <Input
              id={`education-${index}-start`}
              type="month"
              required
              {...register(`educations.${index}.startDate`)}
            />
          </Field>
          <Field htmlFor={`education-${index}-end`} label="End date">
            <Input
              id={`education-${index}-end`}
              type="month"
              required
              {...register(`educations.${index}.endDate`)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function SkillGroupEditor({
  index,
  onRemove,
}: {
  index: number;
  onRemove: () => void;
}) {
  const { control, register } = useFormContext<CareerProfileValues>();

  return (
    <div className="grid gap-5 rounded-md border p-5">
      <ItemHeader label={`Skill group ${index + 1}`} onRemove={onRemove} />
      <div className="grid gap-4 md:grid-cols-3">
        <Field htmlFor={`skill-group-${index}-label`} label="Label">
          <Input
            id={`skill-group-${index}-label`}
            placeholder="Frontend"
            required
            {...register(`skillGroups.${index}.label`)}
          />
        </Field>
        <div className="grid gap-2 md:col-span-2">
          <Label>Skills</Label>
          <Controller
            control={control}
            name={`skillGroups.${index}.skills`}
            render={({ field, fieldState }) => (
              <>
                <StringListInput
                  ariaLabel={`Skills for group ${index + 1}`}
                  invalid={fieldState.invalid}
                  placeholder="Type a skill and press Enter"
                  value={field.value}
                  onChange={field.onChange}
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
      </div>
    </div>
  );
}

function ExperienceEditor({
  availableSkills,
  index,
  onRemove,
}: {
  availableSkills: string[];
  index: number;
  onRemove: () => void;
}) {
  const { control, register } = useFormContext<CareerProfileValues>();
  const bullets = useFieldArray({
    control,
    name: `experiences.${index}.bullets`,
  });
  const isCurrent = useWatch({
    control,
    name: `experiences.${index}.isCurrent`,
  });

  return (
    <div className="grid gap-5 rounded-md border p-5">
      <ItemHeader label={`Experience ${index + 1}`} onRemove={onRemove} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field htmlFor={`experience-${index}-job-title`} label="Job title">
          <Input
            id={`experience-${index}-job-title`}
            required
            {...register(`experiences.${index}.jobTitle`)}
          />
        </Field>
        <Field
          htmlFor={`experience-${index}-company-name`}
          label="Company name"
        >
          <Input
            id={`experience-${index}-company-name`}
            required
            {...register(`experiences.${index}.companyName`)}
          />
        </Field>
        <Field htmlFor={`experience-${index}-location`} label="Location">
          <Input
            id={`experience-${index}-location`}
            required
            {...register(`experiences.${index}.location`)}
          />
        </Field>
        <Field
          htmlFor={`experience-${index}-employment-type`}
          label="Employment type"
          optional
        >
          <Input
            id={`experience-${index}-employment-type`}
            placeholder="Full-time"
            {...register(`experiences.${index}.employmentType`)}
          />
        </Field>
        <Field htmlFor={`experience-${index}-start`} label="Start date">
          <Input
            id={`experience-${index}-start`}
            type="month"
            required
            {...register(`experiences.${index}.startDate`)}
          />
        </Field>
        <Field htmlFor={`experience-${index}-end`} label="End date" optional>
          <Input
            id={`experience-${index}-end`}
            type="month"
            disabled={isCurrent}
            required={!isCurrent}
            {...register(`experiences.${index}.endDate`)}
          />
        </Field>
      </div>
      <Controller
        control={control}
        name={`experiences.${index}.isCurrent`}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`experience-${index}-current`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={`experience-${index}-current`}>
              I currently work here
            </Label>
          </div>
        )}
      />
      <div className="grid gap-2">
        <Label>Skills</Label>
        <Controller
          control={control}
          name={`experiences.${index}.skills`}
          render={({ field, fieldState }) => (
            <>
              <StringListInput
                allowedValues={availableSkills}
                ariaLabel={`Skills for experience ${index + 1}`}
                invalid={fieldState.invalid}
                placeholder="Select a profile skill"
                value={field.value}
                onChange={field.onChange}
              />
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
      </div>
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Bullets</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => bullets.append({ text: "" })}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Add bullet
          </Button>
        </div>
        {bullets.fields.map((bullet, bulletIndex) => (
          <div key={bullet.id} className="flex items-start gap-2">
            <Textarea
              aria-label={`Experience ${index + 1} bullet ${bulletIndex + 1}`}
              required
              {...register(`experiences.${index}.bullets.${bulletIndex}.text`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={bullets.fields.length === 1}
              onClick={() => bullets.remove(bulletIndex)}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              <span className="sr-only">Remove bullet</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectEditor({
  availableSkills,
  index,
  onRemove,
}: {
  availableSkills: string[];
  index: number;
  onRemove: () => void;
}) {
  const { control, register } = useFormContext<CareerProfileValues>();
  const bullets = useFieldArray({
    control,
    name: `projects.${index}.bullets`,
  });
  const isCurrent = useWatch({
    control,
    name: `projects.${index}.isCurrent`,
  });

  return (
    <div className="grid gap-5 rounded-md border p-5">
      <ItemHeader label={`Project ${index + 1}`} onRemove={onRemove} />
      <div className="grid gap-4 md:grid-cols-3">
        <Field htmlFor={`project-${index}-name`} label="Project name">
          <Input
            id={`project-${index}-name`}
            required
            {...register(`projects.${index}.projectName`)}
          />
        </Field>
        <Field htmlFor={`project-${index}-start`} label="Start date">
          <Input
            id={`project-${index}-start`}
            type="month"
            required
            {...register(`projects.${index}.startDate`)}
          />
        </Field>
        <Field htmlFor={`project-${index}-end`} label="End date" optional>
          <Input
            id={`project-${index}-end`}
            type="month"
            disabled={isCurrent}
            required={!isCurrent}
            {...register(`projects.${index}.endDate`)}
          />
        </Field>
      </div>
      <Controller
        control={control}
        name={`projects.${index}.isCurrent`}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`project-${index}-current`}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={`project-${index}-current`}>
              This project is ongoing
            </Label>
          </div>
        )}
      />
      <div className="grid gap-2">
        <Label>Skills</Label>
        <Controller
          control={control}
          name={`projects.${index}.skills`}
          render={({ field, fieldState }) => (
            <>
              <StringListInput
                allowedValues={availableSkills}
                ariaLabel={`Skills for project ${index + 1}`}
                invalid={fieldState.invalid}
                placeholder="Select a profile skill"
                value={field.value}
                onChange={field.onChange}
              />
              {fieldState.error && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
      </div>
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Bullets</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => bullets.append({ text: "" })}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Add bullet
          </Button>
        </div>
        {bullets.fields.map((bullet, bulletIndex) => (
          <div key={bullet.id} className="flex items-start gap-2">
            <Textarea
              aria-label={`Project ${index + 1} bullet ${bulletIndex + 1}`}
              required
              {...register(`projects.${index}.bullets.${bulletIndex}.text`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={bullets.fields.length === 1}
              onClick={() => bullets.remove(bulletIndex)}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              <span className="sr-only">Remove bullet</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CareerProfileForm() {
  const { careerProfile, isError, isLoading, refetch, saveCareerProfile } =
    useCareerProfile();
  const form = useForm<CareerProfileValues>({
    resolver: zodResolver(careerProfileSchema),
    defaultValues: emptyCareerProfile(),
  });
  const educations = useFieldArray({
    control: form.control,
    name: "educations",
  });
  const skillGroups = useFieldArray({
    control: form.control,
    name: "skillGroups",
  });
  const experiences = useFieldArray({
    control: form.control,
    name: "experiences",
  });
  const projects = useFieldArray({
    control: form.control,
    name: "projects",
  });
  const watchedSkillGroups = useWatch({
    control: form.control,
    name: "skillGroups",
  });
  const availableSkills = [
    ...new Map(
      watchedSkillGroups
        .flatMap((group) => group.skills)
        .map((skill) => [skill.toLocaleLowerCase(), skill]),
    ).values(),
  ];

  useEffect(() => {
    if (!isLoading) {
      form.reset(careerProfile ?? emptyCareerProfile());
    }
  }, [careerProfile, form, isLoading]);

  async function onSubmit(values: CareerProfileValues) {
    try {
      await saveCareerProfile.mutateAsync(values);
      toast.success("Career profile saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save career profile",
      );
    }
  }

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
      <form
        className="grid gap-10"
        onSubmit={form.handleSubmit(onSubmit, () =>
          toast.error("Review the required fields"),
        )}
      >
        <section className="grid gap-6">
          <h2 className="text-lg font-semibold">Personal details</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field htmlFor="career-profile-name" label="Name">
              <Input
                id="career-profile-name"
                autoComplete="name"
                required
                {...form.register("name")}
              />
            </Field>
            <Field htmlFor="career-profile-email" label="Email">
              <Input
                id="career-profile-email"
                type="email"
                autoComplete="email"
                required
                {...form.register("email")}
              />
            </Field>
            <Field
              htmlFor="career-profile-contact-number"
              label="Contact number"
            >
              <Input
                id="career-profile-contact-number"
                type="tel"
                autoComplete="tel"
                required
                {...form.register("contactNumber")}
              />
            </Field>
            <Field htmlFor="career-profile-linkedin" label="LinkedIn" optional>
              <Input
                id="career-profile-linkedin"
                type="text"
                inputMode="url"
                autoComplete="url"
                {...form.register("linkedin")}
              />
            </Field>
            <Field htmlFor="career-profile-github" label="GitHub" optional>
              <Input
                id="career-profile-github"
                type="text"
                inputMode="url"
                {...form.register("github")}
              />
            </Field>
            <Field
              htmlFor="career-profile-website"
              label="Personal website"
              optional
            >
              <Input
                id="career-profile-website"
                type="text"
                inputMode="url"
                {...form.register("personalWebsite")}
              />
            </Field>
          </div>
        </section>

        <Separator />

        <section className="grid gap-5">
          <SectionHeader
            title="Education"
            actionLabel="Add education"
            onAdd={() => educations.append(emptyEducation())}
          />
          {educations.fields.map((education, index) => (
            <EducationEditor
              key={education.id}
              index={index}
              onRemove={() => educations.remove(index)}
            />
          ))}
        </section>

        <Separator />

        <section className="grid gap-5">
          <SectionHeader
            title="Skills"
            actionLabel="Add skill group"
            onAdd={() => skillGroups.append(emptySkillGroup())}
          />
          {skillGroups.fields.map((group, index) => (
            <SkillGroupEditor
              key={group.id}
              index={index}
              onRemove={() => skillGroups.remove(index)}
            />
          ))}
        </section>

        <Separator />

        <section className="grid gap-5">
          <SectionHeader
            title="Experiences"
            actionLabel="Add experience"
            onAdd={() => experiences.append(emptyExperience())}
          />
          {experiences.fields.map((experience, index) => (
            <ExperienceEditor
              key={experience.id}
              availableSkills={availableSkills}
              index={index}
              onRemove={() => experiences.remove(index)}
            />
          ))}
        </section>

        <Separator />

        <section className="grid gap-5">
          <SectionHeader
            title="Projects"
            actionLabel="Add project"
            onAdd={() => projects.append(emptyProject())}
          />
          {projects.fields.map((project, index) => (
            <ProjectEditor
              key={project.id}
              availableSkills={availableSkills}
              index={index}
              onRemove={() => projects.remove(index)}
            />
          ))}
          {!projects.fields.length && (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No projects added.
            </p>
          )}
        </section>

        <div className="sticky bottom-0 flex justify-end border-t bg-background/95 py-4 supports-[backdrop-filter]:backdrop-blur">
          <Button type="submit" disabled={saveCareerProfile.isPending}>
            <HugeiconsIcon icon={FloppyDiskIcon} strokeWidth={2} />
            {saveCareerProfile.isPending ? "Saving..." : "Save career profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
