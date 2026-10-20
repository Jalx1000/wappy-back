// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateConversationStateDto } from './create-conversation-state.dto';

export class UpdateConversationStateDto extends PartialType(
  CreateConversationStateDto,
) {}
