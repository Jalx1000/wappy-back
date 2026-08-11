import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'companies', version: '1' })
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentBrand() brand: Brand, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(brand.id, dto);
  }

  @Get()
  list(@CurrentBrand() brand: Brand) {
    return this.companiesService.listForBrand(brand.id);
  }

  @Get(':id')
  findOne(@CurrentBrand() brand: Brand, @Param('id') id: string) {
    return this.companiesService.findOne(brand.id, id);
  }

  @Patch(':id')
  update(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(brand.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentBrand() brand: Brand, @Param('id') id: string) {
    return this.companiesService.remove(brand.id, id);
  }
}
