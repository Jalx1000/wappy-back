// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateWhatsappConversationDto } from './create-whatsapp-conversation.dto';

export class UpdateWhatsappConversationDto extends PartialType(
  CreateWhatsappConversationDto,
) {}
