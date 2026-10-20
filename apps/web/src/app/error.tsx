"use client";

import type { ComponentProps } from "react";

import { ErrorPage } from "@/components/shared/error-page";

export default function Error(props: ComponentProps<typeof ErrorPage>) {
  return <ErrorPage {...props} />;
}
