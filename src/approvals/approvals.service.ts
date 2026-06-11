import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApprovalsRepository } from './infrastructure/persistence/relational/repositories/approvals.repository';
import { Approval } from './domain/approval';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { RoleEnum } from '../roles/roles.enum';

@Injectable()
export class ApprovalsService {
  constructor(private readonly approvalsRepo: ApprovalsRepository) {}

  async getById(id: number, brandId: number): Promise<Approval> {
    const approval = await this.approvalsRepo.findById(id);
    if (!approval || approval.brandId !== brandId) {
      throw new NotFoundException('Approval not found');
    }
    return approval;
  }

  async getByBrand(brandId: number, status?: string): Promise<Approval[]> {
    return this.approvalsRepo.findByBrandAndStatus(brandId, status);
  }

  async create(brandId: number, userId: number, dto: CreateApprovalDto): Promise<Approval> {
    const approval = new Approval();
    approval.brandId = brandId;
    approval.assetId = dto.assetId;
    approval.requestedByUserId = userId;
    approval.status = 'pending';
    approval.annotations = [];
    return this.approvalsRepo.save(approval);
  }

  async review(
    id: number,
    brandId: number,
    userId: number,
    userRole: RoleEnum,
    dto: ReviewApprovalDto,
  ): Promise<Approval> {
    if (userRole !== RoleEnum.agency_admin && userRole !== RoleEnum.admin) {
      throw new ForbiddenException('Only admins can review approvals');
    }

    const approval = await this.getById(id, brandId);
    approval.status = dto.status;
    approval.feedback = dto.feedback;
    approval.reviewedByUserId = userId;
    if (dto.annotations) {
      approval.annotations = dto.annotations;
    }
    return this.approvalsRepo.save(approval);
  }
}
