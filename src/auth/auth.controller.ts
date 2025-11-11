import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('verify-email')
  verifyEmail(@Query('email') email: string) {
    return this.authService.verifyEmail(email);
  }
}
