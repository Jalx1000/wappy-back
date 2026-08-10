import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamRepository } from './infrastructure/persistence/team.repository';
import { Team } from './domain/team';
import { UsersService } from '../users/users.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly usersService: UsersService,
  ) {}

  create(dto: CreateTeamDto): Promise<Team> {
    return this.teamRepository.create({
      brandId: dto.brandId,
      name: dto.name,
    });
  }

  listForBrand(brandId: number): Promise<Team[]> {
    return this.teamRepository.findByBrandId(brandId);
  }

  async rename(id: string, name: string | undefined): Promise<Team> {
    if (!name || !name.trim()) {
      throw new UnprocessableEntityException({
        status: 422,
        errors: { name: 'required' },
      });
    }
    const updated = await this.teamRepository.update(id, { name: name.trim() });
    if (!updated) throw new NotFoundException('Team not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const team = await this.teamRepository.findById(id);
    if (!team) throw new NotFoundException('Team not found');
    await this.teamRepository.remove(id);
  }

  async addMember(teamId: string, userId: number): Promise<Team> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    await this.teamRepository.addMember(teamId, userId);
    return (await this.teamRepository.findById(teamId)) ?? team;
  }

  async removeMember(teamId: string, userId: number): Promise<Team> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');
    await this.teamRepository.removeMember(teamId, userId);
    return (await this.teamRepository.findById(teamId)) ?? team;
  }
}
