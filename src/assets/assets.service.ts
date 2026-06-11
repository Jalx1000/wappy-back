import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetsRepository } from './infrastructure/persistence/relational/repositories/assets.repository';
import { Asset } from './domain/asset';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly assetsRepo: AssetsRepository) {}

  async getById(id: number, brandId: number): Promise<Asset> {
    const asset = await this.assetsRepo.findById(id);
    if (!asset || asset.brandId !== brandId) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async getByBrand(brandId: number, type?: string, tags?: string[], limit?: number): Promise<Asset[]> {
    if (type) {
      return this.assetsRepo.findByBrandAndType(brandId, type, limit);
    }
    if (tags && tags.length > 0) {
      return this.assetsRepo.findByBrandAndTags(brandId, tags, limit);
    }
    return this.assetsRepo.findByBrand(brandId, limit);
  }

  async create(brandId: number, userId: number, dto: CreateAssetDto): Promise<Asset> {
    const asset = new Asset();
    asset.brandId = brandId;
    asset.name = dto.name;
    asset.type = dto.type;
    asset.mimeType = dto.mimeType;
    asset.fileId = dto.fileId;
    asset.tags = dto.tags;
    asset.metadata = dto.metadata;
    asset.uploadedByUserId = userId;
    return this.assetsRepo.save(asset);
  }

  async update(id: number, brandId: number, dto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.getById(id, brandId);
    if (dto.name) asset.name = dto.name;
    if (dto.type) asset.type = dto.type;
    if (dto.tags) asset.tags = dto.tags;
    if (dto.metadata) asset.metadata = dto.metadata;
    return this.assetsRepo.save(asset);
  }

  async delete(id: number, brandId: number): Promise<void> {
    const asset = await this.getById(id, brandId);
    await this.assetsRepo.delete(asset.id);
  }
}
