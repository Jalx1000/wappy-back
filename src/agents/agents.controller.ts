import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { FindAllAgentsDto } from './dto/find-all-agents.dto';
import { TestAgentDto } from './dto/test-agent.dto';
import { Agent } from './domain/agent';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { AgentRuntimeResult } from './runtime/agent-runtime';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'agents',
  version: '1',
})
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiCreatedResponse({ type: Agent })
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  @ApiOkResponse({ type: InfinityPaginationResponse(Agent) })
  async findAll(
    @Query() query: FindAllAgentsDto,
  ): Promise<InfinityPaginationResponseDto<Agent>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.agentsService.findAllWithPagination({
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({ type: Agent })
  findById(@Param('id') id: string) {
    return this.agentsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({ type: Agent })
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  remove(@Param('id') id: string) {
    return this.agentsService.remove(id);
  }

  @Post(':id/test')
  @ApiParam({ name: 'id', type: String, required: true })
  test(
    @Param('id') id: string,
    @Body() dto: TestAgentDto,
  ): Promise<AgentRuntimeResult> {
    return this.agentsService.test(id, dto.message);
  }
}
