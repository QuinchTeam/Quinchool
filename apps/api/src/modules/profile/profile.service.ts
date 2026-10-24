import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { env } from "../../core/config/env";
import { PrismaService } from "../../core/database/prisma/prisma.service";
import { domainLog } from "../../core/observability/logger";
import {
  deleteObject,
  putObject,
} from "../../shared/clients/storage/storage-client";
import { AVATAR_TYPES, avatarKey, type AvatarType } from "./profile.contract";

// The bucket stays private: user.image points at our own GET route, which streams the object.
const AVATAR_URL_PREFIX = `${env.BETTER_AUTH_URL}/profile/avatars/`;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async replaceAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: AvatarType },
  ): Promise<string> {
    // A fresh name per upload lets the GET route cache forever without serving stale images.
    const fileName = `${randomUUID()}.${AVATAR_TYPES[file.mimetype]}`;
    await putObject(avatarKey(userId, fileName), file.buffer, file.mimetype);

    const image = `${AVATAR_URL_PREFIX}${userId}/${fileName}`;
    const { image: previous } = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { image: true },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { image } });
    await this.deleteAvatar(previous);

    return image;
  }

  // Best effort: a leftover object costs a few KB; failing the request over it would not be worth it.
  private async deleteAvatar(imageUrl: string | null): Promise<void> {
    if (!imageUrl?.startsWith(AVATAR_URL_PREFIX)) return;
    const [userId, fileName] = imageUrl
      .slice(AVATAR_URL_PREFIX.length)
      .split("/");
    if (!userId || !fileName) return;

    await deleteObject(avatarKey(userId, fileName)).catch((error: unknown) => {
      domainLog("warn", "avatar.delete_failed", {
        domain: "profile",
        errorType: error instanceof Error ? error.name : typeof error,
      });
    });
  }
}
