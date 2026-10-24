import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyHeader } from "@/components/ui/empty";
import { AppIcon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPanel({
  children,
  footerHref,
  footerLabel,
  title,
}: {
  children: ReactNode;
  footerHref: string;
  footerLabel: string;
  title: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">{title}</h2>
      <Card className="flex-1">
        <CardContent className="grid content-start gap-3">
          {children}
        </CardContent>
        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={footerHref} />}
          >
            {footerLabel}
            <AppIcon icon={CaretRightIcon} />
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}

export function DashboardPanelSkeleton({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <Skeleton className="h-5 w-36" />
      <Card className="flex-1">
        <CardContent className="grid content-start gap-3">
          <Empty className="h-full border border-dashed">
            <EmptyHeader className="w-full">
              <Skeleton className="mb-2 size-12 rounded-lg" />
              <Skeleton className="h-7 w-40 max-w-full" />
              <Skeleton className="h-6 w-72 max-w-full" />
            </EmptyHeader>
            <EmptyContent>
              <Skeleton className="h-12 w-36" />
            </EmptyContent>
          </Empty>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-12 w-44 max-w-full" />
        </CardFooter>
      </Card>
    </div>
  );
}
