"use client";

import { useMutation } from "@tanstack/react-query";

import { apiUrl, readApiData, withCredentials } from "@/lib/api";
import { apiFetch, observeOperation } from "@/lib/observability/operation";

// Mirrors the API's limits so a bad file fails instantly instead of after the upload.
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function useAvatarUpload(onUploaded: () => void) {
  return useMutation({
    mutationFn: (file: File) =>
      observeOperation("profile.avatar.upload", async () => {
        if (!AVATAR_ACCEPT.split(",").includes(file.type)) {
          throw new Error("Use a JPG, PNG, WebP, or GIF image.");
        }
        if (file.size > AVATAR_MAX_BYTES) {
          throw new Error("Images must be 2 MB or smaller.");
        }

        const body = new FormData();
        body.append("file", file);
        // No Content-Type header: the browser sets the multipart boundary.
        const response = await apiFetch(apiUrl("/profile/avatar"), {
          ...withCredentials,
          method: "PUT",
          body,
        });

        return readApiData<{ image: string }>(
          response,
          "The photo could not be uploaded.",
        );
      }),
    onSuccess: onUploaded,
  });
}
