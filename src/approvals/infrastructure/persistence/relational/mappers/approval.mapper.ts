import { Injectable } from '@nestjs/common';
import { Approval } from '../../../../domain/approval';
import { ApprovalEntity } from '../entities/approval.entity';

@Injectable()
export class ApprovalMapper {
  toDomain(entity: ApprovalEntity): Approval {
    const domain = new Approval();
    domain.id = entity.id;
    domain.brandId = entity.brandId;
    domain.assetId = entity.assetId;
    domain.requestedByUserId = entity.requestedByUserId;
    domain.reviewedByUserId = entity.reviewedByUserId;
    domain.status = entity.status;
    domain.feedback = entity.feedback;
    domain.annotations = entity.annotations;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  toEntity(domain: Approval): ApprovalEntity {
    const entity = new ApprovalEntity();
    entity.id = domain.id;
    entity.brandId = domain.brandId;
    entity.assetId = domain.assetId;
    entity.requestedByUserId = domain.requestedByUserId;
    entity.reviewedByUserId = domain.reviewedByUserId;
    entity.status = domain.status;
    entity.feedback = domain.feedback;
    entity.annotations = domain.annotations;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
