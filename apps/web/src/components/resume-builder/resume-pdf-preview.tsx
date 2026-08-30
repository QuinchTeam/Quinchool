"use client";

import { Download01Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { resumeFileName } from "@/lib/resume";
import type { CareerProfileValues } from "@/lib/validations/career-profile";

const previewClassName =
  "mx-auto block h-a4-height w-a4-width shrink-0 border border-black/20 bg-white shadow-sm";

interface PdfLayoutNode {
  box?: {
    height?: number;
    paddingBottom?: number;
    paddingTop?: number;
    top?: number;
  };
  children?: PdfLayoutNode[];
}

export interface RenderedResumePdf {
  blob: Blob;
  fillRatio: number;
  pageCount: number;
}

export async function renderResumePdf(
  profile: CareerProfileValues,
): Promise<RenderedResumePdf> {
  const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/resume-builder/resume-pdf-document"),
  ]);
  let layout: PdfLayoutNode | undefined;
  const blob = await pdf(
    <ResumePdfDocument
      profile={profile}
      onRender={(props) => {
        layout = (
          props as typeof props & {
            _INTERNAL__LAYOUT__DATA_?: PdfLayoutNode;
          }
        )._INTERNAL__LAYOUT__DATA_;
      }}
    />,
  ).toBlob();
  const pages = layout?.children ?? [];

  if (pages.length === 0) {
    throw new Error("Could not measure the generated resume PDF.");
  }

  const firstPage = pages[0];
  const pageTop = firstPage?.box?.paddingTop ?? 0;
  const pageBottom =
    (firstPage?.box?.height ?? 0) - (firstPage?.box?.paddingBottom ?? 0);
  const contentBottom = Math.max(
    pageTop,
    ...(firstPage?.children ?? []).map(
      (child) => (child.box?.top ?? 0) + (child.box?.height ?? 0),
    ),
  );

  return {
    blob,
    fillRatio:
      pageBottom > pageTop
        ? (contentBottom - pageTop) / (pageBottom - pageTop)
        : 0,
    pageCount: pages.length,
  };
}

export async function downloadResumePdf(profile: CareerProfileValues) {
  const { blob } = await renderResumePdf(profile);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = resumeFileName(profile.name);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function ResumeSkeleton() {
  return (
    <output
      className={`${previewClassName} px-a4-gutter py-a4-gutter`}
      aria-label="Generating resume preview"
    >
      <Skeleton className="mx-auto h-6 w-64 bg-zinc-200" />
      <Skeleton className="mx-auto mt-2 h-3 w-96 bg-zinc-200" />
      <Skeleton className="mt-5 h-4 w-full bg-zinc-200" />
      <div className="mt-3 space-y-3">
        {[
          "experience-one",
          "experience-two",
          "experience-three",
          "experience-four",
          "skills-one",
          "skills-two",
          "education-one",
          "education-two",
        ].map((line) => (
          <div className="space-y-1" key={line}>
            <Skeleton className="h-3 w-full bg-zinc-200" />
            <Skeleton className="h-3 w-3/4 bg-zinc-200" />
          </div>
        ))}
      </div>
    </output>
  );
}

/** Shown instead of a preview when the career profile failed to load or has
 * not been filled in yet. */
export function CareerProfileFallback({
  isError,
  onRetry,
}: {
  isError: boolean;
  onRetry: () => void;
}) {
  if (isError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load the career profile.
        </p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 border border-dashed p-6 text-center">
      <p className="font-medium">Your career profile is empty.</p>
      <Link
        className="text-sm text-primary underline underline-offset-4"
        href="/resume/career-profile"
      >
        Add your career details
      </Link>
    </div>
  );
}

/** Renders a career profile to a PDF in the browser and shows it, with
 * download and print actions. Shared by the resume builder and the tailor. */
export function ResumePdfPreview({
  isLoading = false,
  profile,
}: {
  isLoading?: boolean;
  profile: CareerProfileValues | null;
}) {
  const [pdfError, setPdfError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const currentProfile = profile;
    let active = true;
    let generatedUrl: string | null = null;

    setPdfError(false);
    setPdfUrl(null);

    async function generatePdf() {
      try {
        const { blob } = await renderResumePdf(currentProfile);

        generatedUrl = URL.createObjectURL(blob);

        if (active) {
          setPdfUrl(generatedUrl);
        } else {
          URL.revokeObjectURL(generatedUrl);
        }
      } catch (error) {
        console.error("Could not generate the resume PDF", error);
        if (active) setPdfError(true);
      }
    }

    void generatePdf();

    return () => {
      active = false;
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [profile]);

  function downloadPdf() {
    if (!profile || !pdfUrl) return;

    const anchor = document.createElement("a");
    anchor.href = pdfUrl;
    anchor.download = resumeFileName(profile.name);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  function openPdf() {
    if (pdfUrl) window.open(pdfUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-w-0 flex-1">
      {!isLoading && (
        <div className="mb-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!pdfUrl}
            onClick={downloadPdf}
          >
            <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
            {pdfUrl ? "Download PDF" : "Generating PDF..."}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!pdfUrl}
            onClick={openPdf}
          >
            <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} />
            Open / Print
          </Button>
        </div>
      )}
      <div className="w-full overflow-x-auto pb-8">
        <div className="min-w-a4-width">
          {isLoading || (!pdfUrl && !pdfError) ? (
            <ResumeSkeleton />
          ) : pdfError ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Could not generate the resume preview.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : (
            <iframe
              className={previewClassName}
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title="Generated resume PDF"
            />
          )}
        </div>
      </div>
    </div>
  );
}
