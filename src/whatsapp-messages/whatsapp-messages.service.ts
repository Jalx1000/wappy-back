import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateWhatsappMessageDto } from './dto/create-whatsapp-message.dto';
import { UpdateWhatsappMessageDto } from './dto/update-whatsapp-message.dto';
import { WhatsappMessageRepository } from './infrastructure/persistence/whatsapp-message.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { WhatsappMessage } from './domain/whatsapp-message';

@Injectable()
export class WhatsappMessagesService {
  constructor(
    // Dependencies here
    private readonly whatsappMessageRepository: WhatsappMessageRepository,
  ) {}

  async create(createWhatsappMessageDto: CreateWhatsappMessageDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.whatsappMessageRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      sentAt: createWhatsappMessageDto.sentAt,

      revokedAt: createWhatsappMessageDto.revokedAt,

      editedFromId: createWhatsappMessageDto.editedFromId,

      source: createWhatsappMessageDto.source,

      status: createWhatsappMessageDto.status,

      mediaUrl: createWhatsappMessageDto.mediaUrl,

      mediaId: createWhatsappMessageDto.mediaId,

      content: createWhatsappMessageDto.content,

      messageType: createWhatsappMessageDto.messageType,

      direction: createWhatsappMessageDto.direction,

      externalId: createWhatsappMessageDto.externalId,

      conversationId: createWhatsappMessageDto.conversationId,

      connectionId: createWhatsappMessageDto.connectionId,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.whatsappMessageRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: WhatsappMessage['id']) {
    return this.whatsappMessageRepository.findById(id);
  }

  findByIds(ids: WhatsappMessage['id'][]) {
    return this.whatsappMessageRepository.findByIds(ids);
  }

  async update(
    id: WhatsappMessage['id'],

    updateWhatsappMessageDto: UpdateWhatsappMessageDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.whatsappMessageRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      sentAt: updateWhatsappMessageDto.sentAt,

      revokedAt: updateWhatsappMessageDto.revokedAt,

      editedFromId: updateWhatsappMessageDto.editedFromId,

      source: updateWhatsappMessageDto.source,

      status: updateWhatsappMessageDto.status,

      mediaUrl: updateWhatsappMessageDto.mediaUrl,

      mediaId: updateWhatsappMessageDto.mediaId,

      content: updateWhatsappMessageDto.content,

      messageType: updateWhatsappMessageDto.messageType,

      direction: updateWhatsappMessageDto.direction,

      externalId: updateWhatsappMessageDto.externalId,

      conversationId: updateWhatsappMessageDto.conversationId,

      connectionId: updateWhatsappMessageDto.connectionId,
    });
  }

  remove(id: WhatsappMessage['id']) {
    return this.whatsappMessageRepository.remove(id);
  }
}
