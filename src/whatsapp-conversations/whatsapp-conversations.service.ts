import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateWhatsappConversationDto } from './dto/create-whatsapp-conversation.dto';
import { UpdateWhatsappConversationDto } from './dto/update-whatsapp-conversation.dto';
import { WhatsappConversationRepository } from './infrastructure/persistence/whatsapp-conversation.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { WhatsappConversation } from './domain/whatsapp-conversation';

@Injectable()
export class WhatsappConversationsService {
  constructor(
    // Dependencies here
    private readonly whatsappConversationRepository: WhatsappConversationRepository,
  ) {}

  async create(createWhatsappConversationDto: CreateWhatsappConversationDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.whatsappConversationRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      contactId: createWhatsappConversationDto.contactId,

      lastMessageAt: createWhatsappConversationDto.lastMessageAt,

      waUserPhone: createWhatsappConversationDto.waUserPhone,

      connectionId: createWhatsappConversationDto.connectionId,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.whatsappConversationRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: WhatsappConversation['id']) {
    return this.whatsappConversationRepository.findById(id);
  }

  findByIds(ids: WhatsappConversation['id'][]) {
    return this.whatsappConversationRepository.findByIds(ids);
  }

  async update(
    id: WhatsappConversation['id'],

    updateWhatsappConversationDto: UpdateWhatsappConversationDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.whatsappConversationRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      contactId: updateWhatsappConversationDto.contactId,

      lastMessageAt: updateWhatsappConversationDto.lastMessageAt,

      waUserPhone: updateWhatsappConversationDto.waUserPhone,

      connectionId: updateWhatsappConversationDto.connectionId,
    });
  }

  remove(id: WhatsappConversation['id']) {
    return this.whatsappConversationRepository.remove(id);
  }
}
