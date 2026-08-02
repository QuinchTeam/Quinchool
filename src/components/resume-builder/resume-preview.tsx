"use client";

import { Refresh01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";

import {
  CareerProfileFallback,
  ResumePdfPreview,
} from "@/components/resume-builder/resume-pdf-preview";
import {
  type SortableCheckboxItem,
  SortableCheckboxList,
} from "@/components/resume-builder/sortable-checkbox-list";
import { Button } from "@/components/ui/button";
import { useCareerProfile } from "@/hooks/use-career-profile";
import { filterResumeContent, getResumeItemOrder } from "@/lib/resume";
import type { CareerProfileValues } from "@/lib/validations/career-profile";

function updateExcluded(current: Set<string>, key: string, included: boolean) {
  const next = new Set(current);

  if (included) next.delete(key);
  else next.add(key);

  return next;
}

function ResumeContentToolbar({
  bulletOrder,
  excludedBullets,
  excludedSkills,
  profile,
  setBulletOrder,
  setExcludedBullets,
  setExcludedSkills,
  setSkillOrder,
  skillOrder,
}: {
  bulletOrder: Record<number, number[]>;
  excludedBullets: Set<string>;
  excludedSkills: Set<string>;
  profile: CareerProfileValues;
  setBulletOrder: React.Dispatch<
    React.SetStateAction<Record<number, number[]>>
  >;
  setExcludedBullets: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExcludedSkills: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSkillOrder: React.Dispatch<React.SetStateAction<Record<number, number[]>>>;
  skillOrder: Record<number, number[]>;
}) {
  const hasCustomizations =
    excludedBullets.size > 0 ||
    excludedSkills.size > 0 ||
    Object.keys(bulletOrder).length > 0 ||
    Object.keys(skillOrder).length > 0;

  return (
    <aside className="w-full shrink-0 overflow-y-auto rounded-md border bg-card xl:sticky xl:top-6 xl:max-h-screen xl:w-80">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-4">
        <h2 className="font-semibold">Resume content</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!hasCustomizations}
          onClick={() => {
            setBulletOrder({});
            setExcludedBullets(new Set());
            setExcludedSkills(new Set());
            setSkillOrder({});
          }}
        >
          <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
          Reset
        </Button>
      </div>

      <section className="grid gap-4 p-4">
        <h3 className="text-sm font-semibold">Experience bullets</h3>
        {profile.experiences.map((experience, experienceIndex) => {
          const items: SortableCheckboxItem[] = getResumeItemOrder(
            experience.bullets.length,
            bulletOrder[experienceIndex],
          ).flatMap((bulletIndex) => {
            const bullet = experience.bullets[bulletIndex];
            if (!bullet) return [];

            const id = `${experienceIndex}:${bulletIndex}`;

            return [
              {
                checked: !excludedBullets.has(id),
                id,
                label: bullet.text,
              },
            ];
          });

          return (
            <div
              className="grid gap-3 border-b pb-4 last:border-b-0 last:pb-0"
              key={`${experience.companyName}-${experience.jobTitle}-${experience.startDate}`}
            >
              <div>
                <p className="text-sm font-medium">{experience.jobTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {experience.companyName}
                </p>
              </div>
              <SortableCheckboxList
                items={items}
                onCheckedChange={(id, included) =>
                  setExcludedBullets((current) =>
                    updateExcluded(current, id, included),
                  )
                }
                onReorder={(ids) =>
                  setBulletOrder((current) => ({
                    ...current,
                    [experienceIndex]: ids.map((id) =>
                      Number(id.split(":")[1]),
                    ),
                  }))
                }
              />
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 border-t p-4">
        <h3 className="text-sm font-semibold">Skills</h3>
        {profile.skillGroups.map((group, groupIndex) => {
          const items: SortableCheckboxItem[] = getResumeItemOrder(
            group.skills.length,
            skillOrder[groupIndex],
          ).flatMap((skillIndex) => {
            const skill = group.skills[skillIndex];
            if (skill === undefined) return [];

            const id = `${groupIndex}:${skillIndex}`;

            return [
              {
                checked: !excludedSkills.has(id),
                id,
                label: skill,
              },
            ];
          });

          return (
            <div className="grid gap-2" key={`${group.label}-${groupIndex}`}>
              <p className="text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              <SortableCheckboxList
                items={items}
                onCheckedChange={(id, included) =>
                  setExcludedSkills((current) =>
                    updateExcluded(current, id, included),
                  )
                }
                onReorder={(ids) =>
                  setSkillOrder((current) => ({
                    ...current,
                    [groupIndex]: ids.map((id) => Number(id.split(":")[1])),
                  }))
                }
              />
            </div>
          );
        })}
      </section>
    </aside>
  );
}

export function ResumePreview() {
  const { careerProfile, isError, isLoading, refetch } = useCareerProfile();
  const [bulletOrder, setBulletOrder] = useState<Record<number, number[]>>({});
  const [excludedBullets, setExcludedBullets] = useState<Set<string>>(
    () => new Set(),
  );
  const [excludedSkills, setExcludedSkills] = useState<Set<string>>(
    () => new Set(),
  );
  const [skillOrder, setSkillOrder] = useState<Record<number, number[]>>({});
  const resumeProfile = useMemo(
    () =>
      careerProfile
        ? filterResumeContent(
            careerProfile,
            excludedBullets,
            excludedSkills,
            bulletOrder,
            skillOrder,
          )
        : null,
    [bulletOrder, careerProfile, excludedBullets, excludedSkills, skillOrder],
  );

  if (isError || (!isLoading && !careerProfile)) {
    return (
      <CareerProfileFallback isError={isError} onRetry={() => refetch()} />
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-6 xl:flex-row">
      {careerProfile && (
        <ResumeContentToolbar
          bulletOrder={bulletOrder}
          excludedBullets={excludedBullets}
          excludedSkills={excludedSkills}
          profile={careerProfile}
          setBulletOrder={setBulletOrder}
          setExcludedBullets={setExcludedBullets}
          setExcludedSkills={setExcludedSkills}
          setSkillOrder={setSkillOrder}
          skillOrder={skillOrder}
        />
      )}
      <ResumePdfPreview isLoading={isLoading} profile={resumeProfile} />
    </div>
  );
}
