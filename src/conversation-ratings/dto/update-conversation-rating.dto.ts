// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateConversationRatingDto } from './create-conversation-rating.dto';

export class UpdateConversationRatingDto extends PartialType(
  CreateConversationRatingDto,
) {}
