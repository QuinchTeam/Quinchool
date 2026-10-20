"use client";

import type { ComponentProps } from "react";

import { GlobalErrorPage } from "@/components/shared/global-error-page";

export default function GlobalError(
  props: ComponentProps<typeof GlobalErrorPage>,
) {
  return <GlobalErrorPage {...props} />;
}
