import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationRepository } from './infrastructure/persistence/invitation.repository';
import { Invitation } from './domain/invitation';
import { BrandMembershipsRepository } from '../brands/infrastructure/persistence/relational/repositories/brand-memberships.repository';
import { BrandsRepository } from '../brands/infrastructure/persistence/relational/repositories/brands.repository';
import { BrandMemberRoleEnum } from '../brands/domain/brand-membership';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly membershipsRepo: BrandMembershipsRepository,
    private readonly brandsRepo: BrandsRepository,
    private readonly mailService: MailService,
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
    const invitation = await this.invitationRepository.create({
      brandId: dto.brandId,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      role: dto.role ?? BrandMemberRoleEnum.member,
      token: randomStringGenerator(),
      status: 'pending',
      invitedByUserId,
    });

    // Best-effort email delivery (only for email invites). Never fail the invite
    // creation because the mail transport is down.
    if (invitation.email) {
      try {
        const brand = await this.brandsRepo.findById(dto.brandId);
        await this.mailService.brandInvite({
          to: invitation.email,
          data: {
            token: invitation.token!,
            brandName: brand?.name ?? undefined,
            role: invitation.role ?? undefined,
          },
        });
      } catch (err) {
        this.logger.warn(
          `Invite email to ${invitation.email} failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return invitation;
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
