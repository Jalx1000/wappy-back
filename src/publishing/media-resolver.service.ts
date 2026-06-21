import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AssetsService } from '../assets/assets.service';
import { FileRepository } from '../files/infrastructure/persistence/file.repository';
import fileConfig from '../files/config/file.config';
import { FileConfig, FileDriver } from '../files/config/file-config.type';
import appConfig from '../config/app.config';
import { AppConfig } from '../config/app-config.type';

export interface ResolvedMedia {
  buffer: Buffer;
  mimeType: string;
  size: number;
  name: string;
}

@Injectable()
export class MediaResolverService {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly fileRepository: FileRepository,
  ) {}

  // Download the bytes behind a brand's asset so a provider can re-upload them
  // (e.g. TikTok FILE_UPLOAD). Resolves the storage URL the same way the File
  // domain does — presigned S3 GET, or backendDomain-prefixed local path.
  async resolveAsset(assetId: number, brandId: number): Promise<ResolvedMedia> {
    const asset = await this.assetsService.getById(assetId, brandId);
    if (!asset.fileId) {
      throw new NotFoundException(`Asset #${assetId} has no file attached`);
    }
    const file = await this.fileRepository.findById(asset.fileId);
    if (!file) {
      throw new NotFoundException(`File for asset #${assetId} not found`);
    }

    const url = await this.resolveUrl(file.path);
    const res = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    const buffer = Buffer.from(res.data);

    return {
      buffer,
      mimeType: asset.mimeType,
      size: buffer.length,
      name: asset.name,
    };
  }

  private async resolveUrl(path: string): Promise<string> {
    const cfg = fileConfig() as FileConfig;

    if (cfg.driver === FileDriver.LOCAL) {
      return `${(appConfig() as AppConfig).backendDomain}${path}`;
    }

    const s3 = new S3Client({
      region: cfg.awsS3Region ?? '',
      credentials: {
        accessKeyId: cfg.accessKeyId ?? '',
        secretAccessKey: cfg.secretAccessKey ?? '',
      },
    });
    const command = new GetObjectCommand({
      Bucket: cfg.awsDefaultS3Bucket ?? '',
      Key: path,
    });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
  }
}
