import { MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";

import { CheckboxGroupField } from "@/features/jobs-scraper/components/settings/checkbox-group-field";
import { SettingsSection } from "@/features/jobs-scraper/components/settings/settings-section";
import { JOB_WORK_MODES } from "@/features/jobs-scraper/lib/constants";

export function LocationsSection() {
  return (
    <SettingsSection
      icon={MapPinIcon}
      title="Locations and work modes"
      description="Worldwide modes apply to every country. Philippines modes add local options."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <CheckboxGroupField
          label="Worldwide"
          name="worldwideWorkModes"
          options={JOB_WORK_MODES}
        />
        <CheckboxGroupField
          label="Philippines"
          name="philippinesWorkModes"
          options={JOB_WORK_MODES}
        />
      </div>
    </SettingsSection>
  );
}
