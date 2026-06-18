import { Report } from '../../../../domain/report';
import { ReportEntity } from '../entities/report.entity';

export class ReportMapper {
  static toDomain(entity: ReportEntity): Report {
    const domain = new Report();
    domain.id = entity.id;
    domain.brandId = entity.brandId;
    domain.type = entity.type;
    domain.status = entity.status;
    domain.params = entity.params;
    domain.fileUrl = entity.fileUrl;
    domain.data = entity.data;
    domain.errorMessage = entity.errorMessage;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  static toPersistence(domain: Partial<Report>): Partial<ReportEntity> {
    const entity = new ReportEntity();
    if (domain.brandId !== undefined) entity.brandId = domain.brandId;
    if (domain.type !== undefined) entity.type = domain.type;
    if (domain.status !== undefined) entity.status = domain.status;
    if (domain.params !== undefined) entity.params = domain.params;
    if (domain.fileUrl !== undefined) entity.fileUrl = domain.fileUrl;
    if (domain.data !== undefined) entity.data = domain.data;
    if (domain.errorMessage !== undefined) entity.errorMessage = domain.errorMessage;
    return entity;
  }
}
