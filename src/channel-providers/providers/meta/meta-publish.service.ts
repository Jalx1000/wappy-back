import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const GRAPH_VERSION_DEFAULT = 'v25.0';
const IG_POLL_INTERVAL_MS = 3000;
const IG_MAX_POLLS = 40; // ~2 min for container processing

export interface MetaPublishResult {
  postId: string;
}

@Injectable()
export class MetaPublishService {
  private readonly logger = new Logger(MetaPublishService.name);

  constructor(private readonly config: ConfigService) {}

  private get graphUrl(): string {
    const v = this.config.get<string>(
      'META_GRAPH_VERSION',
      GRAPH_VERSION_DEFAULT,
    );
    return `https://graph.facebook.com/${v}`;
  }

  // Facebook Page video: Graph pulls the file from a public URL. Needs a Page
  // access token (connection.accessToken) and pages_manage_posts.
  async publishFacebookVideo(
    pageId: string,
    pageToken: string,
    videoUrl: string,
    caption?: string,
  ): Promise<MetaPublishResult> {
    const { data } = await axios.post<Record<string, any>>(
      `${this.graphUrl}/${pageId}/videos`,
      null,
      {
        params: {
          file_url: videoUrl,
          description: caption ?? '',
          access_token: pageToken,
        },
      },
    );
    const postId = data.id ?? data.video_id;
    if (!postId) {
      throw new Error(`Facebook publish: no id in response`);
    }
    this.logger.log(`Facebook page video published: ${postId}`);
    return { postId: String(postId) };
  }

  // Instagram Reel: create media container -> poll until FINISHED -> publish.
  // Needs the linked Page token + instagram_content_publish.
  async publishInstagramReel(
    igUserId: string,
    token: string,
    videoUrl: string,
    caption?: string,
  ): Promise<MetaPublishResult> {
    const { data: container } = await axios.post<Record<string, any>>(
      `${this.graphUrl}/${igUserId}/media`,
      null,
      {
        params: {
          media_type: 'REELS',
          video_url: videoUrl,
          caption: caption ?? '',
          access_token: token,
        },
      },
    );
    const creationId = container.id;
    if (!creationId) {
      throw new Error(`Instagram container: no id in response`);
    }

    await this.waitForContainer(creationId, token);

    const { data: published } = await axios.post<Record<string, any>>(
      `${this.graphUrl}/${igUserId}/media_publish`,
      null,
      { params: { creation_id: creationId, access_token: token } },
    );
    const postId = published.id;
    if (!postId) {
      throw new Error(`Instagram publish: no id in response`);
    }
    this.logger.log(`Instagram reel published: ${postId}`);
    return { postId: String(postId) };
  }

  private async waitForContainer(
    creationId: string,
    token: string,
  ): Promise<void> {
    for (let i = 0; i < IG_MAX_POLLS; i++) {
      const { data } = await axios.get<Record<string, any>>(
        `${this.graphUrl}/${creationId}`,
        { params: { fields: 'status_code,status', access_token: token } },
      );
      if (data.status_code === 'FINISHED') return;
      if (data.status_code === 'ERROR') {
        throw new Error(`Instagram container failed: ${data.status ?? 'ERROR'}`);
      }
      await this.sleep(IG_POLL_INTERVAL_MS);
    }
    throw new Error('Instagram container processing timed out');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
