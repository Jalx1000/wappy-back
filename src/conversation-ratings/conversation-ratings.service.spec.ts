import { ConversationRatingsService } from './conversation-ratings.service';
import { ConversationRatingRepository } from './infrastructure/persistence/conversation-rating.repository';

const makeService = (ratings: { score: number }[]) => {
  const repo = {
    findByBrand: jest.fn().mockResolvedValue(ratings),
    create: jest.fn(),
  } as unknown as jest.Mocked<ConversationRatingRepository>;
  return { service: new ConversationRatingsService(repo), repo };
};

describe('ConversationRatingsService.aggregateCsat', () => {
  it('should return a zeroed summary when there are no ratings', async () => {
    const { service } = makeService([]);
    const r = await service.aggregateCsat(7);
    expect(r).toEqual({ count: 0, average: null, distribution: {} });
  });

  it('should compute count, average and score distribution', async () => {
    const { service } = makeService([
      { score: 5 },
      { score: 4 },
      { score: 5 },
      { score: 2 },
    ]);
    const r = await service.aggregateCsat(7);
    expect(r.count).toBe(4);
    expect(r.average).toBe(4); // (5+4+5+2)/4
    expect(r.distribution).toEqual({ '5': 2, '4': 1, '2': 1 });
  });

  it('should forward the brand id and date range to the repository', async () => {
    const { service, repo } = makeService([]);
    const range = { from: new Date('2026-10-01'), to: new Date('2026-10-31') };
    await service.aggregateCsat(42, range);
    expect(repo.findByBrand).toHaveBeenCalledWith(42, range);
  });
});
