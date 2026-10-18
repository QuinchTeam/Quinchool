"use client";

import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icon";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { pageItems } from "@/features/finance-tracker/lib/pagination";

const count = new Intl.NumberFormat("en-PH");

export function HistoryPagination({
  page,
  pageSize,
  total,
  pageCount,
  busy,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  busy: boolean;
  onPage: (page: number) => void;
}) {
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing{" "}
        <span className="font-medium text-foreground tabular-nums">
          {count.format(first)}–{count.format(last)}
        </span>{" "}
        of{" "}
        <span className="font-medium text-foreground tabular-nums">
          {count.format(total)}
        </span>{" "}
        {total === 1 ? "transaction" : "transactions"}
      </p>
      <Pagination aria-label="Transaction pages" className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              disabled={page <= 1 || busy}
              onClick={() => onPage(page - 1)}
              aria-label="Go to previous page"
            >
              <AppIcon icon={CaretLeftIcon} />
              <span className="hidden sm:block">Previous</span>
            </Button>
          </PaginationItem>
          {pageItems(page, pageCount).map((item, i) => (
            <PaginationItem key={item === "gap" ? `gap-${i}` : item}>
              {item === "gap" ? (
                <PaginationEllipsis />
              ) : (
                <Button
                  variant={item === page ? "outline" : "ghost"}
                  size="icon"
                  className="tabular-nums"
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  disabled={busy && item !== page}
                  onClick={() => item !== page && onPage(item)}
                >
                  {item}
                </Button>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <Button
              variant="ghost"
              disabled={page >= pageCount || busy}
              onClick={() => onPage(page + 1)}
              aria-label="Go to next page"
            >
              <span className="hidden sm:block">Next</span>
              <AppIcon icon={CaretRightIcon} />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
