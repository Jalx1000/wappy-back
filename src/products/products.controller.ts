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
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Product } from './domain/product';
import { AuthGuard } from '@nestjs/passport';
import { BrandGuard } from '../brands/guards/brand.guard';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { Brand } from '../brands/domain/brand';

@ApiTags('Products')
@ApiBearerAuth()
@ApiHeader({ name: 'x-brand-id', required: true })
@UseGuards(AuthGuard('jwt'), BrandGuard)
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiCreatedResponse({
    type: Product,
  })
  create(
    @Request() req: { brand: Brand },
    @Body() createProductDto: CreateProductDto,
  ) {
    // Override: el producto SIEMPRE pertenece a la marca del header (no la del body)
    // — evita que un usuario cree productos en otra marca aunque envíe otro brandId
    return this.productsService.create({
      ...createProductDto,
      brandId: req.brand.id,
    });
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(Product),
  })
  async findAll(
    @Request() req: { brand: Brand },
    @Query() query: FindAllProductsDto,
  ): Promise<InfinityPaginationResponseDto<Product>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.productsService.findAllWithPagination({
        paginationOptions: { page, limit },
        // brandId: req.brand.id,   // ← filtra SOLO productos de la marca activa
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: Product,
  })
  async findById(@Request() req: { brand: Brand }, @Param('id') id: string) {
    const product = await this.productsService.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    // 🔒 Scoping: no permitir ver productos de otra marca aunque sepas su ID
    if (product.brandId !== req.brand.id) {
      throw new ForbiddenException(
        'This product does not belong to your brand',
      );
    }
    return product;
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: Product,
  })
  async update(
    @Request() req: { brand: Brand },
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const existing = await this.productsService.findById(id);
    if (!existing) throw new NotFoundException('Product not found');
    if (existing.brandId !== req.brand.id) {
      throw new ForbiddenException(
        'This product does not belong to your brand',
      );
    }
    // No permitir cambiar la marca de un producto (protección)
    const safePayload = { ...updateProductDto };
    delete safePayload.brandId;
    return this.productsService.update(id, safePayload);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  async remove(@Request() req: { brand: Brand }, @Param('id') id: string) {
    const existing = await this.productsService.findById(id);
    if (!existing) throw new NotFoundException('Product not found');
    if (existing.brandId !== req.brand.id) {
      throw new ForbiddenException(
        'This product does not belong to your brand',
      );
    }
    return this.productsService.remove(id);
  }
}
