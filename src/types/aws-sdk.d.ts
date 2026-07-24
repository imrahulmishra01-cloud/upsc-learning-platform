/**
 * Maintenance Note:
 * This ambient type declaration file provides strongly-typed interfaces for the
 * subset of AWS SDK v3 S3 client APIs used by the R2 client integration (`src/lib/r2/client.ts`).
 * 
 * Reason for declaration:
 * The `@aws-sdk/client-s3` package installation in this environment does not include a
 * pre-compiled `dist-types/index.d.ts` declaration tree. To maintain strict TypeScript
 * type safety under `npx tsc --noEmit` without introducing broad `any` types or suppressing
 * compiler diagnostics with `@ts-ignore`, accurate interfaces are explicitly declared below.
 */

declare module "@aws-sdk/client-s3" {
  export interface S3ClientConfig {
    region?: string;
    endpoint?: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  }

  export interface PutObjectCommandInput {
    Bucket: string;
    Key: string;
    ContentType?: string;
    Body?: unknown;
  }

  export interface GetObjectCommandInput {
    Bucket: string;
    Key: string;
    ResponseContentDisposition?: string;
    ResponseContentType?: string;
  }

  export interface HeadObjectCommandInput {
    Bucket: string;
    Key: string;
  }

  export class S3Client {
    constructor(config: S3ClientConfig);
    send<TInput, TOutput>(command: { input: TInput } | unknown): Promise<TOutput>;
  }

  export class PutObjectCommand {
    readonly input: PutObjectCommandInput;
    constructor(input: PutObjectCommandInput);
  }

  export class GetObjectCommand {
    readonly input: GetObjectCommandInput;
    constructor(input: GetObjectCommandInput);
  }

  export class HeadObjectCommand {
    readonly input: HeadObjectCommandInput;
    constructor(input: HeadObjectCommandInput);
  }
}

declare module "@aws-sdk/s3-request-presigner" {
  import type { S3Client } from "@aws-sdk/client-s3";

  export interface RequestPresignerOptions {
    expiresIn?: number;
  }

  export function getSignedUrl(
    client: S3Client,
    command: unknown,
    options?: RequestPresignerOptions
  ): Promise<string>;
}
