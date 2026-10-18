"use client";

import type { Icon } from "@phosphor-icons/react/lib";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { FolderSimpleIcon } from "@phosphor-icons/react/dist/ssr/FolderSimple";
import { GraduationCapIcon } from "@phosphor-icons/react/dist/ssr/GraduationCap";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { WrenchIcon } from "@phosphor-icons/react/dist/ssr/Wrench";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AppIcon } from "@/components/ui/icon";
import { CareerProfileFallback } from "@/features/career-profile/components/career-profile-fallback";
import { useCareerProfile } from "@/features/career-profile/hooks/use-career-profile";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { ResumePdfPreview } from "@/features/resume-builder/components/resume-pdf-preview";
import { SortableCheckboxList } from "@/features/resume-builder/components/sortable-checkbox-list";
import {
  type ResumeLayout,
  useResumeLayout,
} from "@/features/resume-builder/hooks/use-resume-layout";
import {
  filterResumeContent,
  getResumeItemOrder,
  RESUME_CONTACT_FIELDS,
} from "@/features/resume-builder/lib/resume";
import { cn } from "@/lib/utils";

const CONTACT_LABELS: Record<(typeof RESUME_CONTACT_FIELDS)[number], string> = {
  email: "Email",
  contactNumber: "Contact number",
  linkedin: "LinkedIn",
  github: "GitHub",
  personalWebsite: "Personal website",
};

type Order = Record<string, number[]>;

/** Eye button that shows or hides a whole section or entry on the resume. */
function VisibilityToggle({
  hidden,
  label,
  onToggle,
}: {
  hidden: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={`${hidden ? "Show" : "Hide"} ${label}`}
      aria-pressed={hidden}
      onClick={onToggle}
    >
      <AppIcon icon={hidden ? EyeSlashIcon : EyeIcon} />
    </Button>
  );
}

/** Title row of an experience, project or skill group, with its own toggle. */
function EntryHeader({
  hidden,
  onToggle,
  subtitle,
  title,
}: {
  hidden: boolean;
  onToggle: () => void;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className={cn("min-w-0", hidden && "opacity-50")}>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <VisibilityToggle hidden={hidden} label={title} onToggle={onToggle} />
    </div>
  );
}

function PanelSection({
  children,
  empty,
  hidden,
  icon,
  onToggle,
  title,
}: {
  children: ReactNode;
  /** True when the profile has nothing for this section yet. */
  empty: boolean;
  hidden: boolean;
  icon: Icon;
  onToggle: () => void;
  title: string;
}) {
  return (
    <section className="grid gap-4 border-t p-4">
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <h3
          className={cn(
            "flex items-center gap-2 text-base font-semibold",
            hidden && "opacity-50",
          )}
        >
          <AppIcon icon={icon} className="size-4 text-muted-foreground" />
          {title}
        </h3>
        {!empty && (
          <VisibilityToggle hidden={hidden} label={title} onToggle={onToggle} />
        )}
      </div>
      {empty ? (
        <EmptyState
          icon={icon}
          title={`No ${title} Yet`}
          description="Add them in your career profile to show them here."
        />
      ) : (
        // Hidden sections stay editable, just dimmed.
        <div className={cn("grid gap-4", hidden && "opacity-50")}>
          {children}
        </div>
      )}
    </section>
  );
}

function ResumeContentToolbar({
  excluded,
  order,
  profile,
  setExcluded,
  setOrder,
}: {
  excluded: Set<string>;
  order: Order;
  profile: CareerProfileValues;
  setExcluded: React.Dispatch<React.SetStateAction<Set<string>>>;
  setOrder: React.Dispatch<React.SetStateAction<Order>>;
}) {
  const toggle = (id: string, included: boolean) =>
    setExcluded((current) => {
      const next = new Set(current);
      if (included) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Props for a section or entry eye toggle keyed `id`. */
  const visibility = (id: string) => ({
    hidden: excluded.has(id),
    onToggle: () => toggle(id, excluded.has(id)),
  });
  const section = (key: string) => visibility(`section:${key}`);
  const entry = visibility;
  /** Fades an entry's list while the whole entry is hidden. */
  const dimmed = (id: string, content: ReactNode) => (
    <div className={cn(excluded.has(id) && "opacity-50")}>{content}</div>
  );

  /** Checkbox list over `labels`, keyed `${prefix}:${index}`, reorderable. */
  // Values sit on a muted surface so they read as content under their titles.
  const list = (prefix: string, labels: string[], columns = false) => (
    <div className="rounded-lg bg-muted/50 p-2">
      <SortableCheckboxList
        columns={columns}
        // Blank labels (unfilled contacts) are skipped but keep their index.
        items={getResumeItemOrder(labels.length, order[prefix]).flatMap(
          (index) => {
            const id = `${prefix}:${index}`;
            const label = labels[index];
            return label ? [{ checked: !excluded.has(id), id, label }] : [];
          },
        )}
        onCheckedChange={toggle}
        onReorder={(ids) =>
          setOrder((current) => ({
            ...current,
            [prefix]: ids.map((id) => Number(id.split(":").at(-1))),
          }))
        }
      />
    </div>
  );

  const contacts = RESUME_CONTACT_FIELDS.filter((field) => profile[field]);

  return (
    <aside className="w-full shrink-0 overflow-x-hidden overflow-y-auto rounded-md border bg-card xl:max-h-full xl:w-md">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-card p-4">
        <div className="grid gap-1">
          <h2 className="font-semibold">Customize Content</h2>
          <p className="text-xs text-muted-foreground">
            Pick and reorder what shows.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!excluded.size && !Object.keys(order).length}
          onClick={() => {
            setExcluded(new Set());
            setOrder({});
          }}
        >
          <AppIcon icon={ArrowClockwiseIcon} />
          Reset
        </Button>
      </div>

      <PanelSection
        empty={!contacts.length}
        icon={IdentificationCardIcon}
        title="Personal Details"
        {...section("contact")}
      >
        {list(
          "contact",
          RESUME_CONTACT_FIELDS.map((field) =>
            profile[field] ? CONTACT_LABELS[field] : "",
          ),
          true,
        )}
      </PanelSection>

      <PanelSection
        empty={!profile.skillGroups.length}
        icon={WrenchIcon}
        title="Skills"
        {...section("skill")}
      >
        {profile.skillGroups.map((group, i) => (
          <div className="grid gap-2" key={`${group.label}-${i}`}>
            <EntryHeader title={group.label} {...entry(`skill:${i}`)} />
            {dimmed(`skill:${i}`, list(`skill:${i}`, group.skills, true))}
          </div>
        ))}
      </PanelSection>

      <PanelSection
        empty={!profile.experiences.length}
        icon={BriefcaseIcon}
        title="Experiences"
        {...section("exp")}
      >
        {profile.experiences.map((experience, i) => (
          <div
            className="grid gap-3"
            key={`${experience.companyName}-${experience.jobTitle}-${i}`}
          >
            <EntryHeader
              title={experience.jobTitle}
              subtitle={experience.companyName}
              {...entry(`exp:${i}`)}
            />
            {dimmed(
              `exp:${i}`,
              list(
                `exp:${i}`,
                experience.bullets.map((bullet) => bullet.text),
              ),
            )}
          </div>
        ))}
      </PanelSection>

      <PanelSection
        empty={!profile.projects.length}
        icon={FolderSimpleIcon}
        title="Projects"
        {...section("proj")}
      >
        {profile.projects.map((project, i) => (
          <div className="grid gap-3" key={`${project.projectName}-${i}`}>
            <EntryHeader title={project.projectName} {...entry(`proj:${i}`)} />
            {dimmed(
              `proj:${i}`,
              list(
                `proj:${i}`,
                project.bullets.map((bullet) => bullet.text),
              ),
            )}
          </div>
        ))}
      </PanelSection>

      <PanelSection
        empty={!profile.educations.length}
        icon={GraduationCapIcon}
        title="Education"
        {...section("edu")}
      >
        {list(
          "edu",
          profile.educations.map(
            (education) =>
              `${education.degree} in ${education.fieldOfStudy}, ${education.institutionName}`,
          ),
        )}
      </PanelSection>
    </aside>
  );
}

export function ResumePreview() {
  const { careerProfile, error, isLoading, refetch } = useCareerProfile();
  const resumeLayout = useResumeLayout();

  if (error || (!isLoading && !careerProfile)) {
    return <CareerProfileFallback error={error} retry={() => void refetch()} />;
  }

  return (
    <div className="flex w-full flex-col items-start gap-6 xl:min-h-0 xl:flex-1 xl:flex-row">
      {careerProfile && resumeLayout.layout ? (
        <ResumeBuilder
          layout={resumeLayout.layout}
          profile={careerProfile}
          save={resumeLayout.save}
        />
      ) : (
        <ResumePdfPreview isLoading profile={null} />
      )}
    </div>
  );
}

/** Mounted once the saved layout has loaded, so state can start from it. */
function ResumeBuilder({
  layout,
  profile,
  save,
}: {
  layout: ResumeLayout;
  profile: CareerProfileValues;
  save: (layout: ResumeLayout) => void;
}) {
  const [excluded, setExcluded] = useState(() => new Set(layout.excluded));
  const [order, setOrder] = useState<Order>(layout.order);
  const resumeProfile = useMemo(
    () => filterResumeContent(profile, excluded, order),
    [profile, excluded, order],
  );

  // Save after changes settle, so a burst of clicks or a drag sends one request.
  const loaded = useRef(true);
  useEffect(() => {
    if (loaded.current) {
      loaded.current = false;
      return;
    }
    const timer = setTimeout(
      () => save({ excluded: [...excluded], order }),
      600,
    );
    return () => clearTimeout(timer);
  }, [excluded, order, save]);

  return (
    <>
      <ResumeContentToolbar
        excluded={excluded}
        order={order}
        profile={profile}
        setExcluded={setExcluded}
        setOrder={setOrder}
      />
      <ResumePdfPreview profile={resumeProfile} />
    </>
  );
}
