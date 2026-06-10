import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { RoleEnum } from '../../../../roles/roles.enum';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {}

  async run() {
    const roles = [
      { id: RoleEnum.admin, name: 'Admin' },
      { id: RoleEnum.user, name: 'User' },
      { id: RoleEnum.agency_admin, name: 'Agency Admin' },
      { id: RoleEnum.agency_member, name: 'Agency Member' },
      { id: RoleEnum.client, name: 'Client' },
    ];

    for (const role of roles) {
      const count = await this.repository.count({ where: { id: role.id } });
      if (!count) {
        await this.repository.save(this.repository.create(role));
      }
    }
  }
}
