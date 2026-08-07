import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brand } from './domain/brand';
import {
  BrandMemberRoleEnum,
  BrandMembership,
} from './domain/brand-membership';
import { BrandsRepository } from './infrastructure/persistence/relational/repositories/brands.repository';
import { BrandMembershipsRepository } from './infrastructure/persistence/relational/repositories/brand-memberships.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { NullableType } from '../utils/types/nullable.type';
import { RoleEnum } from '../roles/roles.enum';

@Injectable()
export class BrandsService {
  constructor(
    private readonly brandsRepo: BrandsRepository,
    private readonly membershipsRepo: BrandMembershipsRepository,
  ) {}

  async create(dto: CreateBrandDto, creatorUserId: number): Promise<Brand> {
    const existing = await this.brandsRepo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" is already taken`);
    }

    const brand = new Brand();
    brand.name = dto.name;
    brand.slug = dto.slug;
    brand.description = dto.description ?? null;
    brand.isActive = dto.isActive ?? true;

    let created: Brand;
    try {
      created = await this.brandsRepo.create(brand);
    } catch (err) {
      // Postgres unique violation: el UNIQUE INDEX puede atraparlo si
      // findBySlug() falla por race condition o por rows soft-deleted que
      // findBySlug() no ve pero el índice sí. En vez de 500, lanzamos 409.
      const e = err as { code?: string; constraint?: string };
      if (e?.code === '23505' && e?.constraint === 'IDX_brand_slug') {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
      }
      throw err;
    }

    // Auto-add creator as brand admin
    await this.membershipsRepo.upsert(
      creatorUserId,
      created.id,
      BrandMemberRoleEnum.admin,
    );

    if (dto.logoPath) {
      await this.brandsRepo.updateSettings(created.id, {
        logoPath: dto.logoPath,
      });
      created.logoPath = dto.logoPath;
    }

    return created;
  }

  async findAll(): Promise<Brand[]> {
    return this.brandsRepo.findAll();
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandsRepo.findById(id);
    if (!brand) throw new NotFoundException(`Brand #${id} not found`);
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto): Promise<Brand> {
    await this.findOne(id);
    if (dto.slug) {
      const existing = await this.brandsRepo.findBySlug(dto.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Slug "${dto.slug}" is already taken`);
      }
    }
    // logoPath lives in brand_settings, not in the brand table — split it out
    // before the column update or TypeORM rejects the unknown property.
    const { logoPath, ...brandFields } = dto;
    if (logoPath !== undefined) {
      await this.brandsRepo.updateSettings(id, { logoPath });
    }
    if (Object.keys(brandFields).length > 0) {
      await this.brandsRepo.update(id, brandFields);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.brandsRepo.softDelete(id);
  }

  async getBrandIdsForUser(
    userId: number,
    userRole: RoleEnum,
  ): Promise<number[]> {
    if (userRole === RoleEnum.admin || userRole === RoleEnum.agency_admin) {
      const all = await this.brandsRepo.findAll();
      return all.map((b) => b.id);
    }
    return this.membershipsRepo.findBrandIdsByUserId(userId);
  }

  async assertUserCanAccessBrand(
    userId: number,
    brandId: number,
    userRoleId: number,
  ): Promise<void> {
    if (userRoleId === RoleEnum.admin || userRoleId === RoleEnum.agency_admin) {
      return;
    }
    const membership = await this.membershipsRepo.findOne(userId, brandId);
    if (!membership) {
      throw new ForbiddenException('Access to this brand is not allowed');
    }
  }

  async getMembers(brandId: number): Promise<BrandMembership[]> {
    await this.findOne(brandId);
    return this.membershipsRepo.findByBrandId(brandId);
  }

  async addMember(
    brandId: number,
    userId: number,
    role: BrandMemberRoleEnum,
  ): Promise<BrandMembership> {
    await this.findOne(brandId);
    return this.membershipsRepo.upsert(userId, brandId, role);
  }

  async removeMember(brandId: number, userId: number): Promise<void> {
    await this.findOne(brandId);
    await this.membershipsRepo.remove(userId, brandId);
  }

  async getBrandById(id: number): Promise<NullableType<Brand>> {
    return this.brandsRepo.findById(id);
  }
}
