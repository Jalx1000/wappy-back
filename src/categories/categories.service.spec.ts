import { CategoriesService } from './categories.service';
import { CategoryRepository } from './infrastructure/persistence/category.repository';

const makeService = () => {
  const repo = {
    findByBrandAndName: jest.fn(),
    findAllByBrand: jest.fn(() => Promise.resolve([])),
    create: jest.fn((d) => Promise.resolve({ ...d, id: 'cat-new' })),
  } as unknown as jest.Mocked<CategoryRepository>;
  const service = new CategoriesService(repo);
  return { service, repo };
};

describe('CategoriesService.findOrCreate (S2)', () => {
  it('should return the existing category without creating a duplicate', async () => {
    const { service, repo } = makeService();
    (repo.findByBrandAndName as jest.Mock).mockResolvedValue({
      id: 'cat-1',
      brandId: 7,
      name: 'Maderas',
    });

    const res = await service.findOrCreate(7, 'Maderas');

    expect(res?.id).toBe('cat-1');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should create the category when it does not exist', async () => {
    const { service, repo } = makeService();
    (repo.findByBrandAndName as jest.Mock).mockResolvedValue(null);

    const res = await service.findOrCreate(7, '  Didácticos  ');

    expect(repo.create).toHaveBeenCalledWith({
      brandId: 7,
      name: 'Didácticos',
    });
    expect(res?.id).toBe('cat-new');
  });

  it('should ignore a blank name (no create)', async () => {
    const { service, repo } = makeService();

    const res = await service.findOrCreate(7, '   ');

    expect(res).toBeNull();
    expect(repo.findByBrandAndName).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should resolve to the existing row when a concurrent insert wins the race', async () => {
    const { service, repo } = makeService();
    (repo.findByBrandAndName as jest.Mock)
      .mockResolvedValueOnce(null) // first check: not there
      .mockResolvedValueOnce({ id: 'cat-raced', brandId: 7, name: 'Maderas' });
    (repo.create as jest.Mock).mockRejectedValue(
      new Error('duplicate key value violates unique constraint'),
    );

    const res = await service.findOrCreate(7, 'Maderas');

    expect(res?.id).toBe('cat-raced');
  });
});
