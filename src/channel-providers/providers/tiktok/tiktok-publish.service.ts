import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const BASE = 'https://open.tiktokapis.com/v2/post/publish';
const CREATOR_INFO_URL = `${BASE}/creator_info/query/`;
const DIRECT_INIT_URL = `${BASE}/video/init/`;
const INBOX_INIT_URL = `${BASE}/inbox/video/init/`;
const STATUS_URL = `${BASE}/status/fetch/`;

const MB = 1024 * 1024;
// TikTok requires each chunk in [5MB, 64MB]; a whole video <= 64MB goes as one
// chunk. We use 10MB chunks for larger videos and let the final chunk absorb
// the remainder (TikTok allows the trailing chunk to exceed chunk_size).
const CHUNK_SIZE = 10 * MB;
const MAX_SINGLE_CHUNK = 64 * MB;

export type TiktokPublishMode = 'direct' | 'inbox';

export type TiktokPrivacyLevel =
  | 'PUBLIC_TO_EVERYONE'
  | 'MUTUAL_FOLLOW_FRIENDS'
  | 'FOLLOWER_OF_CREATOR'
  | 'SELF_ONLY';

export interface TiktokDirectPostInfo {
  title?: string;
  privacyLevel: TiktokPrivacyLevel;
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  coverTimestampMs?: number;
}

export interface TiktokCreatorInfo {
  creatorUsername?: string;
  creatorNickname?: string;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number;
}

export interface TiktokPublishResult {
  publishId: string;
  mode: TiktokPublishMode;
}

export interface TiktokPublishStatus {
  status: string;
  failReason?: string;
  postIds: string[];
  uploadedBytes?: number;
}

@Injectable()
export class TiktokPublishService {
  private readonly logger = new Logger(TiktokPublishService.name);

  // Direct Post requires querying creator info first: it returns the privacy
  // options the creator allows and the interaction toggles, which TikTok
  // validates against on init.
  async queryCreatorInfo(accessToken: string): Promise<TiktokCreatorInfo> {
    const { data } = await axios.post<Record<string, any>>(
      CREATOR_INFO_URL,
      {},
      { headers: this.jsonHeaders(accessToken) },
    );
    this.assertOk(data, 'creator_info');
    const d = (data.data as Record<string, any>) ?? {};
    return {
      creatorUsername: d.creator_username,
      creatorNickname: d.creator_nickname,
      privacyLevelOptions: d.privacy_level_options ?? [],
      commentDisabled: Boolean(d.comment_disabled),
      duetDisabled: Boolean(d.duet_disabled),
      stitchDisabled: Boolean(d.stitch_disabled),
      maxVideoPostDurationSec: Number(d.max_video_post_duration_sec ?? 0),
    };
  }

  async publishVideo(
    accessToken: string,
    video: { buffer: Buffer; mimeType: string },
    opts: { mode: TiktokPublishMode; postInfo?: TiktokDirectPostInfo },
  ): Promise<TiktokPublishResult> {
    const videoSize = video.buffer.length;
    if (videoSize === 0) {
      throw new Error('TikTok publish: empty video');
    }
    const { chunkSize, totalChunkCount } = this.chunkPlan(videoSize);
    const sourceInfo = {
      source: 'FILE_UPLOAD',
      video_size: videoSize,
      chunk_size: chunkSize,
      total_chunk_count: totalChunkCount,
    };

    let publishId: string;
    let uploadUrl: string;

    if (opts.mode === 'direct') {
      if (!opts.postInfo) {
        throw new Error('TikTok direct post requires postInfo');
      }
      const { data } = await axios.post<Record<string, any>>(
        DIRECT_INIT_URL,
        {
          post_info: {
            title: opts.postInfo.title ?? '',
            privacy_level: opts.postInfo.privacyLevel,
            disable_comment: opts.postInfo.disableComment ?? false,
            disable_duet: opts.postInfo.disableDuet ?? false,
            disable_stitch: opts.postInfo.disableStitch ?? false,
            video_cover_timestamp_ms: opts.postInfo.coverTimestampMs ?? 0,
          },
          source_info: sourceInfo,
        },
        { headers: this.jsonHeaders(accessToken) },
      );
      this.assertOk(data, 'direct init');
      publishId = data.data.publish_id;
      uploadUrl = data.data.upload_url;
    } else {
      const { data } = await axios.post<Record<string, any>>(
        INBOX_INIT_URL,
        { source_info: sourceInfo },
        { headers: this.jsonHeaders(accessToken) },
      );
      this.assertOk(data, 'inbox init');
      publishId = data.data.publish_id;
      uploadUrl = data.data.upload_url;
    }

    await this.uploadChunks(
      uploadUrl,
      video.buffer,
      chunkSize,
      totalChunkCount,
      video.mimeType,
    );
    this.logger.log(`TikTok ${opts.mode} publish initiated: ${publishId}`);
    return { publishId, mode: opts.mode };
  }

  async fetchStatus(
    accessToken: string,
    publishId: string,
  ): Promise<TiktokPublishStatus> {
    const { data } = await axios.post<Record<string, any>>(
      STATUS_URL,
      { publish_id: publishId },
      { headers: this.jsonHeaders(accessToken) },
    );
    this.assertOk(data, 'status');
    const d = (data.data as Record<string, any>) ?? {};
    return {
      status: d.status,
      failReason: d.fail_reason,
      postIds:
        d.publicaly_available_post_id ?? d.publicly_available_post_id ?? [],
      uploadedBytes: d.uploaded_bytes,
    };
  }

  private async uploadChunks(
    uploadUrl: string,
    buffer: Buffer,
    chunkSize: number,
    totalChunkCount: number,
    mimeType: string,
  ): Promise<void> {
    const total = buffer.length;
    for (let i = 0; i < totalChunkCount; i++) {
      const start = i * chunkSize;
      // The final chunk runs to the end, absorbing any remainder.
      const end = i === totalChunkCount - 1 ? total - 1 : start + chunkSize - 1;
      const chunk = buffer.subarray(start, end + 1);
      await axios.put(uploadUrl, chunk, {
        headers: {
          'Content-Type': mimeType || 'video/mp4',
          'Content-Length': String(chunk.length),
          'Content-Range': `bytes ${start}-${end}/${total}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
    }
  }

  private chunkPlan(videoSize: number): {
    chunkSize: number;
    totalChunkCount: number;
  } {
    if (videoSize <= MAX_SINGLE_CHUNK) {
      return { chunkSize: videoSize, totalChunkCount: 1 };
    }
    return {
      chunkSize: CHUNK_SIZE,
      totalChunkCount: Math.floor(videoSize / CHUNK_SIZE),
    };
  }

  private jsonHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    };
  }

  // The Content Posting API (open.tiktokapis.com/v2) always returns an `error`
  // object; success is code === 'ok'.
  private assertOk(data: Record<string, any>, ctx: string): void {
    const err = data?.error as Record<string, any> | undefined;
    if (err && err.code && err.code !== 'ok') {
      throw new Error(
        `TikTok ${ctx}: ${err.code} ${err.message ?? ''} (log_id=${err.log_id ?? ''})`,
      );
    }
  }
}
