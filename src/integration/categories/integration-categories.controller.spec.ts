import { IntegrationCategoriesController } from './integration-categories.controller';
import { CategoriesService } from '../../categories/categories.service';

const makeController = () => {
  const categories = {
    findOrCreate: jest.fn(() => Promise.resolve({ id: 'c', name: 'x' })),
    findAllByBrand: jest.fn(() =>
      Promise.resolve([
        { id: 'c1', name: 'Didácticos' },
        { id: 'c2', name: 'Peluches' },
      ]),
    ),
  } as unknown as jest.Mocked<CategoriesService>;
  const controller = new IntegrationCategoriesController(categories);
  return { controller, categories };
};

const req = { brand: { id: 7 } } as { brand: { id: number } };

describe('IntegrationCategoriesController', () => {
  it('should find-or-create every pushed name and return the brand taxonomy', async () => {
    const { controller, categories } = makeController();

    const res = await controller.upsert(req as never, {
      names: ['Didácticos', 'Peluches'],
    });

    expect(categories.findOrCreate).toHaveBeenCalledWith(7, 'Didácticos');
    expect(categories.findOrCreate).toHaveBeenCalledWith(7, 'Peluches');
    expect(categories.findOrCreate).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ categories: ['Didácticos', 'Peluches'] });
  });
});
