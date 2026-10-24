import { z } from "zod";

// SVG is left out on purpose: it can carry scripts.
export const AVATAR_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

export type AvatarType = keyof typeof AVATAR_TYPES;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function isAvatarType(type: string): type is AvatarType {
  return type in AVATAR_TYPES;
}

export function avatarKey(userId: string, fileName: string): string {
  return `avatars/${userId}/${fileName}`;
}

// Matches only names we generate (uuid + known extension), so the route can't read arbitrary keys.
export const avatarParamsSchema = z.object({
  userId: z.string().regex(/^[a-z0-9]+$/i),
  fileName: z.string().regex(/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/),
});

export type AvatarParams = z.infer<typeof avatarParamsSchema>;

export interface AvatarUpload {
  image: string;
}
