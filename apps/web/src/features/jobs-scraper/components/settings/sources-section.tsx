import { BroadcastIcon } from "@phosphor-icons/react/dist/ssr/Broadcast";

import { CheckboxGroupField } from "@/features/jobs-scraper/components/settings/checkbox-group-field";
import { SectionCard } from "@/features/jobs-scraper/components/shared/section-card";
import { JOB_SOURCES } from "@/features/jobs-scraper/lib/constants";

export function SourcesSection() {
  return (
    <SectionCard
      icon={BroadcastIcon}
      title="Sources"
      description="Job boards the next scan reads from."
    >
      <CheckboxGroupField name="sources" options={JOB_SOURCES} />
    </SectionCard>
  );
}
