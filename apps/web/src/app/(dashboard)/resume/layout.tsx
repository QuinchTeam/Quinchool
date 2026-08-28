import { ResumeTabs } from "@/components/resume-builder/resume-tabs";

export default function ResumeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-full max-w-7xl flex-col gap-8 p-6">
      <ResumeTabs />
      {children}
    </div>
  );
}
