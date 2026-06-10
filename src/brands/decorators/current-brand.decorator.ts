import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Brand } from '../domain/brand';

export const CurrentBrand = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Brand => {
    const request = ctx.switchToHttp().getRequest();
    return request.activeBrand as Brand;
  },
);
