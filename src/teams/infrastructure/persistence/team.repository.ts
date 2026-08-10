import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Team } from '../../domain/team';

export abstract class TeamRepository {
  abstract create(
    data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Team>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Team[]>;

  abstract findById(id: Team['id']): Promise<NullableType<Team>>;

  abstract findByIds(ids: Team['id'][]): Promise<Team[]>;

  abstract findByBrandId(brandId: number): Promise<Team[]>;

  abstract addMember(teamId: Team['id'], userId: number): Promise<void>;

  abstract removeMember(teamId: Team['id'], userId: number): Promise<void>;

  abstract update(
    id: Team['id'],
    payload: DeepPartial<Team>,
  ): Promise<Team | null>;

  abstract remove(id: Team['id']): Promise<void>;
}
