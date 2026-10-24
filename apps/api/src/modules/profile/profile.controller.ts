import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Res,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";

import { SessionGuard, UserId } from "../../core/auth/session.guard";
import { getObject } from "../../shared/clients/storage/storage-client";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import {
  AVATAR_MAX_BYTES,
  type AvatarParams,
  avatarKey,
  avatarParamsSchema,
  type AvatarUpload,
  isAvatarType,
} from "./profile.contract";
import { ProfileService } from "./profile.service";

@Controller("profile")
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  // multer rejects bodies over the limit with 413 before this runs.
  @Put("avatar")
  @UseGuards(SessionGuard)
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: AVATAR_MAX_BYTES } }),
  )
  async replaceAvatar(
    @UserId() userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<AvatarUpload> {
    if (!file) {
      throw new BadRequestException({
        code: "FILE_REQUIRED",
        message: "Choose an image to upload.",
      });
    }
    const { mimetype } = file;
    if (!isAvatarType(mimetype)) {
      throw new UnsupportedMediaTypeException({
        code: "UNSUPPORTED_IMAGE_TYPE",
        message: "Use a JPG, PNG, WebP, or GIF image.",
      });
    }

    return {
      image: await this.profile.replaceAvatar(userId, {
        buffer: file.buffer,
        mimetype,
      }),
    };
  }

  // Public on purpose: <img> tags can't send our auth cookie cross-site, and the random
  // file name makes the URL unguessable. @Res() skips the JSON envelope for raw bytes.
  @Get("avatars/:userId/:fileName")
  async getAvatar(
    @Param(new ZodValidationPipe(avatarParamsSchema)) params: AvatarParams,
    @Res() response: Response,
  ): Promise<void> {
    const object = await getObject(avatarKey(params.userId, params.fileName));
    if (!object) {
      throw new NotFoundException({
        code: "AVATAR_NOT_FOUND",
        message: "Avatar not found",
      });
    }

    response.set({
      "Content-Type": object.contentType,
      // Each upload gets a new file name, so a cached copy is never stale.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    object.body.pipe(response);
  }
}
