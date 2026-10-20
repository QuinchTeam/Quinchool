import { NotepadIcon } from "@phosphor-icons/react/dist/ssr/Notepad";

import { AppHeader } from "@/components/shared/app-header";
import {
  ResumeHeaderActionsProvider,
  ResumeHeaderActionsSlot,
} from "@/features/resume-builder/components/resume-header-actions";
import { ResumeTabs } from "@/features/resume-builder/components/resume-tabs";

export default function ResumeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ResumeHeaderActionsProvider>
      {/* On xl screens, only the PDF scrolls; smaller screens scroll the whole page. */}
      <div className="flex w-full min-w-0 flex-col gap-8 p-6 xl:h-full">
        <AppHeader
          icon={NotepadIcon}
          title="Resume"
          description="Tailor a resume to a job or build one from your career profile."
        >
          <ResumeHeaderActionsSlot />
        </AppHeader>
        <ResumeTabs />
        {children}
      </div>
    </ResumeHeaderActionsProvider>
  );
}
