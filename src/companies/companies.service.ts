import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyRepository } from './infrastructure/persistence/company.repository';
import { Company } from './domain/company';

@Injectable()
export class CompaniesService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  create(brandId: number, dto: CreateCompanyDto): Promise<Company> {
    return this.companyRepository.create({
      brandId,
      name: dto.name,
      domain: dto.domain ?? null,
      industry: dto.industry ?? null,
      location: dto.location ?? null,
      plan: dto.plan ?? null,
      seats: dto.seats ?? null,
      notes: dto.notes ?? null,
    });
  }

  listForBrand(brandId: number): Promise<Company[]> {
    return this.companyRepository.findByBrandId(brandId);
  }

  async findOne(brandId: number, id: string): Promise<Company> {
    const company = await this.companyRepository.findById(id);
    if (!company || company.brandId !== brandId) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(
    brandId: number,
    id: string,
    dto: UpdateCompanyDto,
  ): Promise<Company> {
    await this.findOne(brandId, id); // enforce brand ownership
    const updated = await this.companyRepository.update(id, dto);
    if (!updated) throw new NotFoundException('Company not found');
    return updated;
  }

  async remove(brandId: number, id: string): Promise<void> {
    await this.findOne(brandId, id); // enforce brand ownership
    await this.companyRepository.remove(id);
  }
}
