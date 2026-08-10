// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateInvitationDto } from './create-invitation.dto';

export class UpdateInvitationDto extends PartialType(CreateInvitationDto) {}
