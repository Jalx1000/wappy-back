import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import {
  BackfillSummary,
  MetaProfileBackfillService,
} from '../database/backfill/meta-profile-backfill.service';

// Admin-only maintenance actions triggered over HTTP (so they can run inside the
// deployed container, where the internal DB + provider tokens are reachable,
// without needing SSH).
@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller({ path: 'maintenance', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MaintenanceController {
  constructor(private readonly backfill: MetaProfileBackfillService) {}

  /**
   * Backfills peer display names for IG/Messenger threads that were created
   * before the profile lookup existed. Idempotent — only touches threads whose
   * peer name is still null.
   */
  @Post('backfill/meta-profiles')
  @Roles(RoleEnum.admin, RoleEnum.agency_admin)
  runMetaProfilesBackfill(): Promise<BackfillSummary> {
    return this.backfill.run();
  }
}
