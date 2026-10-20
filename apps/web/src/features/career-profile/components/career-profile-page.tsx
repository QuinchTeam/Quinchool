import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";

import { AppHeader } from "@/components/shared/app-header";
import { CareerProfileForm } from "@/features/career-profile/components/career-profile-form";

export function CareerProfilePage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-8 p-6">
      <AppHeader
        icon={IdentificationCardIcon}
        title="Career Profile"
        description="Your details, education, skills, and experience. Every resume is built from this."
      />
      <CareerProfileForm />
    </div>
  );
}
