import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OpenShiftDto, CloseShiftDto, CashMovementDto } from './dto/shift.dto';

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Get()
  findAll() {
    return this.shiftsService.findAll();
  }

  @Get('open')
  getOpenShift(@CurrentUser() user: any) {
    return this.shiftsService.getOpenShift(user.id);
  }

  @Post('open')
  open(@Body() dto: OpenShiftDto, @CurrentUser() user: any) {
    return this.shiftsService.open(dto, user);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @Body() dto: CloseShiftDto, @CurrentUser() user: any) {
    return this.shiftsService.close(id, dto, user);
  }

  @Post(':id/cash-movement')
  cashMovement(@Param('id') id: string, @Body() dto: CashMovementDto, @CurrentUser() user: any) {
    return this.shiftsService.cashMovement(id, dto, user);
  }
}