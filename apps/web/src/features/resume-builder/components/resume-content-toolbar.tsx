"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { BriefcaseIcon } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { FolderSimpleIcon } from "@phosphor-icons/react/dist/ssr/FolderSimple";
import { GraduationCapIcon } from "@phosphor-icons/react/dist/ssr/GraduationCap";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { WrenchIcon } from "@phosphor-icons/react/dist/ssr/Wrench";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { SortableCheckboxGroup } from "@/components/ui/checkbox-group";
import { AppIcon } from "@/components/ui/icon";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { EntryHeader } from "@/features/resume-builder/components/entry-header";
import { PanelSection } from "@/features/resume-builder/components/panel-section";
import type { ResumeLayout } from "@/features/resume-builder/hooks/use-resume-layout";
import {
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

type Order = ResumeLayout["order"];

export function ResumeContentToolbar({
  excluded,
  order,
  profile,
  setExcluded,
  setOrder,
}: {
  excluded: Set<string>;
  order: Order;
  profile: CareerProfileValues;
  setExcluded: Dispatch<SetStateAction<Set<string>>>;
  setOrder: Dispatch<SetStateAction<Order>>;
}) {
  const toggle = (id: string, included: boolean) =>
    setExcluded((current) => {
      const next = new Set(current);
      if (included) next.delete(id);
      else next.add(id);
      return next;
    });

  const visibility = (id: string) => ({
    hidden: excluded.has(id),
    onToggle: () => toggle(id, excluded.has(id)),
  });
  const section = (key: string) => visibility(`section:${key}`);
  const entry = visibility;
  const dimmed = (id: string, content: ReactNode) => (
    <div className={cn(excluded.has(id) && "opacity-50")}>{content}</div>
  );

  const list = (prefix: string, labels: string[], columns = false) => {
    // Preserve contact indices when skipping blanks so hide/order keys stay aligned.
    const items = getResumeItemOrder(labels.length, order[prefix]).flatMap(
      (index) => {
        const label = labels[index];
        return label ? [{ label, value: `${prefix}:${index}` }] : [];
      },
    );

    return (
      <div className="rounded-lg bg-muted/50 p-2">
        {/* Short skill labels use three columns; bullets stay full width. */}
        <SortableCheckboxGroup
          className={cn(columns && "grid-cols-3")}
          wrap={columns}
          items={items}
          value={items
            .map((item) => item.value)
            .filter((id) => !excluded.has(id))}
          onValueChange={(checked) =>
            setExcluded((current) => {
              const next = new Set(current);
              for (const { value } of items) {
                if (checked.includes(value)) next.delete(value);
                else next.add(value);
              }
              return next;
            })
          }
          onReorder={(ids) =>
            setOrder((current) => ({
              ...current,
              [prefix]: ids.map((id) => Number(id.split(":").at(-1))),
            }))
          }
        />
      </div>
    );
  };

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
