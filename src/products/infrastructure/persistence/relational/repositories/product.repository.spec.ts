import { ProductRelationalRepository } from './product.repository';

// Regression: GET /products must scope to the active brand and return the
// newest products first, so a just-created product shows up on page 1.
describe('ProductRelationalRepository.findAllWithPagination', () => {
  const makeRepo = () => {
    const typeorm = { find: jest.fn().mockResolvedValue([]) };
    const repo = new ProductRelationalRepository(typeorm as never);
    return { repo, typeorm };
  };

  it('should scope to the given brand and order newest first', async () => {
    const { repo, typeorm } = makeRepo();

    await repo.findAllWithPagination({
      paginationOptions: { page: 1, limit: 50 },
      brandId: 7,
    });

    expect(typeorm.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { brandId: 7 },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 50,
      }),
    );
  });

  it('should not filter by brand when none is given (still newest first)', async () => {
    const { repo, typeorm } = makeRepo();

    await repo.findAllWithPagination({
      paginationOptions: { page: 2, limit: 10 },
    });

    expect(typeorm.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      }),
    );
  });
});
