"use client";

import { ResumeHeaderActions } from "@/features/resume-builder/components/resume-header-actions";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { MagnifyingGlassMinusIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlassMinus";
import { MagnifyingGlassPlusIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlassPlus";
import { PrinterIcon } from "@phosphor-icons/react/dist/ssr/Printer";
import { AppIcon } from "@/components/ui/icon";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { resumeFileName } from "@/features/resume-builder/lib/resume";
import { observeOperation } from "@/lib/observability/operation";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

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
  return observeOperation("resume-builder.pdf-render", async () => {
    const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/features/resume-builder/components/resume-pdf-document"),
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
  });
}

export async function downloadResumePdf(profile: CareerProfileValues) {
  return observeOperation("resume-builder.pdf-download", async () => {
    const { blob } = await renderResumePdf(profile);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = resumeFileName(profile.name);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });
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

export function ResumePdfPreview({
  isLoading = false,
  profile,
}: {
  isLoading?: boolean;
  profile: CareerProfileValues | null;
}) {
  const [pdfError, setPdfError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  // Round zoom steps to avoid floating-point values such as 0.7000000000000001.
  const stepZoom = (delta: number) =>
    setZoom((z) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 10) / 10)),
    );

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
      } catch {
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
    <div className="w-full min-w-0 flex-1 xl:h-full xl:overflow-y-auto">
      <ResumeHeaderActions>
        {!isLoading && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!pdfUrl}
              onClick={downloadPdf}
            >
              <AppIcon icon={DownloadSimpleIcon} />
              {pdfUrl ? "Download PDF" : "Generating PDF..."}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!pdfUrl}
              onClick={openPdf}
            >
              <AppIcon icon={PrinterIcon} />
              Open / Print
            </Button>
          </>
        )}
      </ResumeHeaderActions>
      <div className="sticky top-0 z-10 flex justify-end pb-2">
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Zoom out"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => stepZoom(-ZOOM_STEP)}
          >
            <AppIcon icon={MagnifyingGlassMinusIcon} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-label="Reset zoom"
            className="min-w-14 font-mono tabular-nums"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Zoom in"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => stepZoom(ZOOM_STEP)}
          >
            <AppIcon icon={MagnifyingGlassPlusIcon} />
          </Button>
        </div>
      </div>
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
              // Remount at each zoom level so Chrome's PDF viewer refits instead of cropping.
              key={zoom}
              className={previewClassName}
              style={{
                width: `calc(var(--spacing-a4-width) * ${zoom})`,
                height: `calc(var(--spacing-a4-height) * ${zoom})`,
              }}
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title="Generated resume PDF"
            />
          )}
        </div>
      </div>
    </div>
  );
}
