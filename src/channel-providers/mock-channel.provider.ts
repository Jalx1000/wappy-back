import { Injectable } from '@nestjs/common';
import { ChannelEnum } from '../connections/domain/channel.enum';
import { Connection } from '../connections/domain/connection';
import {
  ChannelProvider,
  DateRange,
  MetricRow,
  PostData,
  TokenData,
} from './channel-provider.interface';
import { MetricEnum } from '../metrics/domain/metric.enum';

@Injectable()
export class MockChannelProvider implements ChannelProvider {
  channel = ChannelEnum.instagram;

  fetchMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<MetricRow[]> {
    const rows: MetricRow[] = [];
    const days = this.eachDay(dateRange.from, dateRange.to);

    let followers = 5000 + Math.floor(Math.random() * 3000);

    for (const date of days) {
      const growthRate = 0.003 + Math.random() * 0.009;
      followers = Math.round(followers * (1 + growthRate));
      const engagementRate = 0.02 + Math.random() * 0.06;
      const reach = Math.round(followers * (0.05 + Math.random() * 0.15));
      const impressions = Math.round(reach * (1.2 + Math.random() * 0.8));
      const engagement = Math.round(reach * engagementRate);
      const likes = Math.round(engagement * 0.75);
      const comments = Math.round(engagement * 0.1);
      const shares = Math.round(engagement * 0.15);

      const push = (metric: string, value: number) =>
        rows.push({
          connectionId: connection.id,
          brandId: connection.brandId,
          date,
          metric,
          value,
        });

      push(MetricEnum.followers, followers);
      push(MetricEnum.reach, reach);
      push(MetricEnum.impressions, impressions);
      push(MetricEnum.engagement, engagement);
      push(
        MetricEnum.engagement_rate,
        Math.round(engagementRate * 10000) / 100,
      );
      push(MetricEnum.likes, likes);
      push(MetricEnum.comments, comments);
      push(MetricEnum.shares, shares);
    }

    return Promise.resolve(rows);
  }

  fetchPosts(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<PostData[]> {
    const days = this.eachDay(dateRange.from, dateRange.to);
    const postDays = days.filter((_, i) => i % 3 === 0);
    const types = ['image', 'video', 'carousel', 'reel', 'story'];

    const posts: PostData[] = postDays.map((date, i) => {
      const reach = 500 + Math.floor(Math.random() * 3000);
      const engagementRate = 0.02 + Math.random() * 0.08;
      const engagement = Math.round(reach * engagementRate);
      return {
        brandId: connection.brandId,
        connectionId: connection.id,
        externalId: `mock_${connection.id}_${date.toISOString().slice(0, 10)}_${i}`,
        publishedAt: date,
        type: types[i % types.length],
        caption: `Post de prueba ${i + 1} — contenido generado para demo`,
        mediaUrl: null,
        metrics: {
          reach,
          impressions: Math.round(reach * 1.3),
          engagement,
          likes: Math.round(engagement * 0.75),
          comments: Math.round(engagement * 0.1),
          shares: Math.round(engagement * 0.15),
        },
      };
    });

    return Promise.resolve(posts);
  }

  refreshToken(_connection: Connection): Promise<TokenData> {
    return Promise.resolve({
      accessToken: 'mock_refreshed_token',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });
  }

  private eachDay(from: Date, to: Date): Date[] {
    const days: Date[] = [];
    const cur = new Date(from);
    cur.setUTCHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setUTCHours(0, 0, 0, 0);
    while (cur <= end) {
      days.push(new Date(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
  }
}
