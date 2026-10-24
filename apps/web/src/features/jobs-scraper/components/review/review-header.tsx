import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { ListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import Link from "next/link";

import { AppHeader } from "@/components/shared/app-header";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";

export function ReviewHeader() {
  return (
    <AppHeader
      icon={ListChecksIcon}
      title="Review Scan Results"
      description="Every listing the crawler read, with the verdict the scan gave it. Move anything the scan got wrong — your choice sticks and later scans will not overwrite it."
    >
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href="/jobs-scraper" />}
      >
        <AppIcon icon={CaretLeftIcon} />
        Back to jobs
      </Button>
    </AppHeader>
  );
}
