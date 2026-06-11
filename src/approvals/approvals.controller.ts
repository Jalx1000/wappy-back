import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { Brand } from '../brands/domain/brand';
import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ReviewApprovalDto } from './dto/review-approval.dto';

@ApiTags('Approvals')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'approvals', version: '1' })
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @ApiQuery({ name: 'status', type: String, required: false })
  async getApprovals(
    @CurrentBrand() brand: Brand,
    @Query('status') status?: string,
  ) {
    return this.approvalsService.getByBrand(brand.id, status);
  }

  @Get(':id')
  async getApproval(
    @CurrentBrand() brand: Brand,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.approvalsService.getById(id, brand.id);
  }

  @Post()
  async create(
    @CurrentBrand() brand: Brand,
    @CurrentUser() user: JwtPayloadType,
    @Body() dto: CreateApprovalDto,
  ) {
    return this.approvalsService.create(brand.id, Number(user.id), dto);
  }

  @Patch(':id/review')
  async review(
    @CurrentBrand() brand: Brand,
    @CurrentUser() user: JwtPayloadType,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewApprovalDto,
  ) {
    return this.approvalsService.review(id, brand.id, Number(user.id), user.role as any, dto);
  }
}
