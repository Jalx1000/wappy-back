import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Agent } from '../../domain/agent';

export abstract class AgentRepository {
  abstract create(
    data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Agent>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Agent[]>;

  abstract findById(id: Agent['id']): Promise<NullableType<Agent>>;

  // All agents for a brand (newest first).
  abstract findByBrand(brandId: number): Promise<Agent[]>;

  // All enabled agents for a brand (one-agent-per-brand today, array-ready).
  abstract findEnabledByBrand(brandId: number): Promise<Agent[]>;

  abstract update(
    id: Agent['id'],
    payload: DeepPartial<Agent>,
  ): Promise<Agent | null>;

  abstract remove(id: Agent['id']): Promise<void>;
}
