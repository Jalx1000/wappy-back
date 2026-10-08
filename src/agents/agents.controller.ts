import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BrandGuard } from '../brands/guards/brand.guard';
import { CurrentBrand } from '../brands/decorators/current-brand.decorator';
import { Brand } from '../brands/domain/brand';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { TestAgentDto } from './dto/test-agent.dto';
import { AgentRuntimeResult } from './runtime/agent-runtime';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({ path: 'agents', version: '1' })
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentBrand() brand: Brand, @Body() dto: CreateAgentDto) {
    return this.agentsService.create(brand.id, dto);
  }

  @Get()
  list(@CurrentBrand() brand: Brand) {
    return this.agentsService.listForBrand(brand.id);
  }

  @Get(':id')
  findOne(@CurrentBrand() brand: Brand, @Param('id') id: string) {
    return this.agentsService.findOne(brand.id, id);
  }

  @Patch(':id')
  update(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agentsService.update(brand.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentBrand() brand: Brand, @Param('id') id: string) {
    return this.agentsService.remove(brand.id, id);
  }

  @Post(':id/test')
  test(
    @CurrentBrand() brand: Brand,
    @Param('id') id: string,
    @Body() dto: TestAgentDto,
  ): Promise<AgentRuntimeResult> {
    return this.agentsService.test(brand.id, id, dto.message);
  }
}
