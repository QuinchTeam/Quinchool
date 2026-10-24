import { BroadcastIcon } from "@phosphor-icons/react/dist/ssr/Broadcast";

import { CheckboxGroupField } from "@/features/jobs-scraper/components/settings/checkbox-group-field";
import { SettingsSection } from "@/features/jobs-scraper/components/settings/settings-section";
import { JOB_SOURCES } from "@/features/jobs-scraper/lib/constants";

export function SourcesSection() {
  return (
    <SettingsSection
      icon={BroadcastIcon}
      title="Sources"
      description="Job boards the next scan reads from."
    >
      <CheckboxGroupField name="sources" options={JOB_SOURCES} />
    </SettingsSection>
  );
}
