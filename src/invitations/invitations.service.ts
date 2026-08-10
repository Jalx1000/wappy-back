import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationRepository } from './infrastructure/persistence/invitation.repository';
import { Invitation } from './domain/invitation';
import { BrandMembershipsRepository } from '../brands/infrastructure/persistence/relational/repositories/brand-memberships.repository';
import { BrandMemberRoleEnum } from '../brands/domain/brand-membership';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly membershipsRepo: BrandMembershipsRepository,
  ) {}

  /** Creates a pending invitation (by email or phone) for a brand. */
  async invite(
    dto: CreateInvitationDto,
    invitedByUserId: number,
  ): Promise<Invitation> {
    if (!dto.email && !dto.phone) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { email: 'emailOrPhoneRequired' },
      });
    }
    return this.invitationRepository.create({
      brandId: dto.brandId,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      role: dto.role ?? BrandMemberRoleEnum.member,
      token: randomStringGenerator(),
      status: 'pending',
      invitedByUserId,
    });
  }

  listForBrand(brandId: number): Promise<Invitation[]> {
    return this.invitationRepository.findPendingByBrandId(brandId);
  }

  findByToken(token: string): Promise<Invitation | null> {
    return this.invitationRepository.findByToken(token);
  }

  /** Marks an invitation revoked so it can no longer be accepted. */
  async revoke(id: string): Promise<void> {
    const invitation = await this.invitationRepository.findById(id);
    if (!invitation) throw new NotFoundException('Invitation not found');
    await this.invitationRepository.update(id, { status: 'revoked' });
  }

  /**
   * Accepts a pending invitation for the given user: grants brand membership
   * with the invited role and marks the invitation accepted.
   */
  async accept(token: string, userId: number): Promise<Invitation> {
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'pending') {
      throw new ConflictException('Invitation is no longer valid');
    }

    const role = this.toRole(invitation.role);
    await this.membershipsRepo.upsert(userId, invitation.brandId!, role);

    const updated = await this.invitationRepository.update(invitation.id, {
      status: 'accepted',
    });
    return updated ?? invitation;
  }

  private toRole(role: string | null | undefined): BrandMemberRoleEnum {
    return Object.values(BrandMemberRoleEnum).includes(
      role as BrandMemberRoleEnum,
    )
      ? (role as BrandMemberRoleEnum)
      : BrandMemberRoleEnum.member;
  }
}
