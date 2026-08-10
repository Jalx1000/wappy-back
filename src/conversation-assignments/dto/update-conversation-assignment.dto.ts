// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateConversationAssignmentDto } from './create-conversation-assignment.dto';

export class UpdateConversationAssignmentDto extends PartialType(
  CreateConversationAssignmentDto,
) {}
