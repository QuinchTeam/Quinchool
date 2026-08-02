"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RESUME_TABS = [
  {
    value: "/resume/resume-tailor",
    label: "Resume Tailor",
    href: "/resume/resume-tailor",
  },
  {
    value: "/resume/career-profile",
    label: "Career Profile",
    href: "/resume/career-profile",
  },
  {
    value: "/resume/resume-builder",
    label: "Resume Builder",
    href: "/resume/resume-builder",
  },
] as const;

export function ResumeTabs() {
  const pathname = usePathname();
  const activeTab =
    RESUME_TABS.find((tab) => tab.href === pathname)?.value ??
    RESUME_TABS[0].value;

  return (
    <Tabs value={activeTab}>
      <TabsList>
        {RESUME_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            nativeButton={false}
            render={<Link href={tab.href} />}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
