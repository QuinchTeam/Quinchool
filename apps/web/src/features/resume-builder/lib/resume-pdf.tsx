import type { CareerProfileValues } from "@/features/career-profile/validations/career-profile";
import { resumeFileName } from "@/features/resume-builder/lib/resume";
import { observeOperation } from "@/lib/observability/operation";

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
