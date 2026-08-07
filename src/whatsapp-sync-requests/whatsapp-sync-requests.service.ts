import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateWhatsappSyncRequestDto } from './dto/create-whatsapp-sync-request.dto';
import { UpdateWhatsappSyncRequestDto } from './dto/update-whatsapp-sync-request.dto';
import { WhatsappSyncRequestRepository } from './infrastructure/persistence/whatsapp-sync-request.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { WhatsappSyncRequest } from './domain/whatsapp-sync-request';

@Injectable()
export class WhatsappSyncRequestsService {
  constructor(
    // Dependencies here
    private readonly whatsappSyncRequestRepository: WhatsappSyncRequestRepository,
  ) {}

  async create(createWhatsappSyncRequestDto: CreateWhatsappSyncRequestDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.whatsappSyncRequestRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      progress: createWhatsappSyncRequestDto.progress,

      phase: createWhatsappSyncRequestDto.phase,

      status: createWhatsappSyncRequestDto.status,

      syncType: createWhatsappSyncRequestDto.syncType,

      requestId: createWhatsappSyncRequestDto.requestId,

      connectionId: createWhatsappSyncRequestDto.connectionId,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.whatsappSyncRequestRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: WhatsappSyncRequest['id']) {
    return this.whatsappSyncRequestRepository.findById(id);
  }

  findByIds(ids: WhatsappSyncRequest['id'][]) {
    return this.whatsappSyncRequestRepository.findByIds(ids);
  }

  async update(
    id: WhatsappSyncRequest['id'],

    updateWhatsappSyncRequestDto: UpdateWhatsappSyncRequestDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.whatsappSyncRequestRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      progress: updateWhatsappSyncRequestDto.progress,

      phase: updateWhatsappSyncRequestDto.phase,

      status: updateWhatsappSyncRequestDto.status,

      syncType: updateWhatsappSyncRequestDto.syncType,

      requestId: updateWhatsappSyncRequestDto.requestId,

      connectionId: updateWhatsappSyncRequestDto.connectionId,
    });
  }

  remove(id: WhatsappSyncRequest['id']) {
    return this.whatsappSyncRequestRepository.remove(id);
  }
}
