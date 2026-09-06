import { ResumeTabs } from "@/components/resume-builder/resume-tabs";

export default function ResumeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-8 p-6">
      <ResumeTabs />
      {children}
    </div>
  );
}
