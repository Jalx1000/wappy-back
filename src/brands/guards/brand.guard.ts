import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayloadType } from '../../auth/strategies/types/jwt-payload.type';
import { RoleEnum } from '../../roles/roles.enum';
import { BrandsService } from '../brands.service';

/**
 * Reads x-brand-id header, validates user membership, and attaches brand to request.
 * Must be applied after AuthGuard('jwt').
 */
@Injectable()
export class BrandGuard implements CanActivate {
  constructor(private readonly brandsService: BrandsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayloadType | undefined = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    const brandIdHeader = request.headers['x-brand-id'];
    if (!brandIdHeader) {
      throw new ForbiddenException('x-brand-id header is required');
    }

    const brandId = parseInt(brandIdHeader as string, 10);
    if (isNaN(brandId)) {
      throw new ForbiddenException('x-brand-id must be a valid number');
    }

    const roleId = Number(user.role?.id);

    // Agency admins and system admins bypass brand membership check
    if (roleId === RoleEnum.admin || roleId === RoleEnum.agency_admin) {
      const brand = await this.brandsService.getBrandById(brandId);
      if (!brand) {
        throw new ForbiddenException(`Brand #${brandId} not found`);
      }
      request.activeBrand = brand;
      return true;
    }

    // For other roles, check JWT brandIds first (fast path), then DB
    if (user.brandIds?.length) {
      if (!user.brandIds.includes(brandId)) {
        throw new ForbiddenException('Access to this brand is not allowed');
      }
    } else {
      await this.brandsService.assertUserCanAccessBrand(
        Number(user.id),
        brandId,
        roleId,
      );
    }

    const brand = await this.brandsService.getBrandById(brandId);
    if (!brand) {
      throw new ForbiddenException(`Brand #${brandId} not found`);
    }

    request.activeBrand = brand;
    return true;
  }
}
