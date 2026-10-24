import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ServiceUnavailableException } from "@nestjs/common";
import type { Readable } from "node:stream";

import { env } from "../../../core/config/env";

let s3: S3Client | undefined;

function client(): S3Client {
  if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new ServiceUnavailableException({
      code: "STORAGE_NOT_CONFIGURED",
      message: "File storage is not configured yet.",
    });
  }
  // Path-style addressing works on both R2 and Garage; Garage has no per-bucket subdomains locally.
  s3 ??= new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
  return s3;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

// Null when the key does not exist, so callers can answer 404.
export async function getObject(
  key: string,
): Promise<{ body: Readable; contentType: string } | null> {
  try {
    const object = await client().send(
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    );
    return {
      body: object.Body as Readable,
      contentType: object.ContentType ?? "application/octet-stream",
    };
  } catch (error) {
    if (error instanceof NoSuchKey) return null;
    throw error;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
  );
}
