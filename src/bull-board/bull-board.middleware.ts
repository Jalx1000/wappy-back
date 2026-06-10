import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { RoleEnum } from '../roles/roles.enum';

@Injectable()
export class BullBoardMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const secret = this.configService.get('auth.secret') ||
        process.env.AUTH_JWT_SECRET ||
        'secret';

      const payload = this.jwtService.verify(token, { secret });

      const role = payload.role as RoleEnum;
      if (role !== RoleEnum.admin && role !== RoleEnum.agency_admin) {
        throw new ForbiddenException('Only admin users can access Bull Board');
      }

      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
