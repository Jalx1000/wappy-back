import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import axios from 'axios';
import { promises as fs } from 'fs';
import * as path from 'path';
import { FileRepository } from './infrastructure/persistence/file.repository';
import { FileType } from './domain/file';
import fileConfig from './config/file.config';
import { FileConfig, FileDriver } from './config/file-config.type';
import { AllConfigType } from '../config/config.type';

const LOCAL_DIR = './files';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/aac': 'aac',
  'application/pdf': 'pdf',
};

const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(EXT_BY_MIME).map(([mime, ext]) => [ext, mime]),
);

/**
 * Persists remote (expiring) Meta media/avatars into our own storage so their
 * URLs never expire. Works for both file drivers: LOCAL writes to ./files, S3
 * uploads the object. Stored files are served back through a stable, permanent
 * URL (`GET /media-file/:id`, see MediaFileController) — never a presigned or
 * CDN url that can expire.
 */
@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);

  constructor(
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  /** Permanent, non-expiring URL for a stored file (served by our backend). */
  servedUrl(file: Pick<FileType, 'id'>): string {
    const domain = this.configService.get('app.backendDomain', { infer: true });
    const prefix = this.configService.get('app.apiPrefix', { infer: true });
    return `${domain}/${prefix}/v1/media-file/${file.id}`;
  }

  /**
   * Downloads a remote url and stores it. Returns the permanent served url, or
   * null on any failure (caller keeps the original url — nothing breaks).
   */
  async storeUrlAndGetServedUrl(
    url: string,
    opts?: { token?: string },
  ): Promise<string | null> {
    const file = await this.storeFromUrl(url, opts);
    return file ? this.servedUrl(file) : null;
  }

  async storeFromUrl(
    url: string,
    opts?: { token?: string },
  ): Promise<FileType | null> {
    try {
      const res = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        headers: opts?.token
          ? { Authorization: `Bearer ${opts.token}` }
          : undefined,
        timeout: 20000,
        maxContentLength: 30 * 1024 * 1024,
      });
      const mime = String(
        res.headers['content-type'] ?? 'application/octet-stream',
      ).split(';')[0];
      return await this.storeBuffer(Buffer.from(res.data), mime);
    } catch (err) {
      this.logger.debug(
        `storeFromUrl failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  async storeBuffer(buffer: Buffer, mimeType: string): Promise<FileType> {
    const ext = EXT_BY_MIME[mimeType] ?? 'bin';
    const name = `${randomStringGenerator()}.${ext}`;
    const cfg = fileConfig() as FileConfig;

    if (cfg.driver === FileDriver.LOCAL) {
      await fs.mkdir(LOCAL_DIR, { recursive: true });
      await fs.writeFile(path.join(LOCAL_DIR, name), buffer);
      const prefix = this.configService.get('app.apiPrefix', { infer: true });
      return this.fileRepository.create({
        path: `/${prefix}/v1/files/${name}`,
      });
    }

    await this.s3Client(cfg).send(
      new PutObjectCommand({
        Bucket: cfg.awsDefaultS3Bucket ?? '',
        Key: name,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return this.fileRepository.create({ path: name });
  }

  /** Reads a stored file's bytes by File id (used by the serving endpoint). */
  async readById(
    id: FileType['id'],
  ): Promise<{ buffer: Buffer; mime: string } | null> {
    const file = await this.fileRepository.findById(id);
    if (!file) return null;
    const cfg = fileConfig() as FileConfig;
    try {
      if (cfg.driver === FileDriver.LOCAL) {
        const name = file.path.split('/').pop() ?? '';
        const buffer = await fs.readFile(path.join(LOCAL_DIR, name));
        return { buffer, mime: mimeFromName(name) };
      }
      const res = await this.s3Client(cfg).send(
        new GetObjectCommand({
          Bucket: cfg.awsDefaultS3Bucket ?? '',
          Key: file.path,
        }),
      );
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) return null;
      return {
        buffer: Buffer.from(bytes),
        mime: res.ContentType ?? mimeFromName(file.path),
      };
    } catch (err) {
      this.logger.warn(
        `readById(${id}) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  private s3Client(cfg: FileConfig): S3Client {
    return new S3Client({
      region: cfg.awsS3Region ?? '',
      credentials: {
        accessKeyId: cfg.accessKeyId ?? '',
        secretAccessKey: cfg.secretAccessKey ?? '',
      },
    });
  }
}

function mimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}
