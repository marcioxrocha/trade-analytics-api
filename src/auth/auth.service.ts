import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {

  constructor(private configService: ConfigService){}

  verifyEmail(email: string) {
    if (!email) {
      throw new BadRequestException('O parâmetro de consulta "email" é obrigatório.');
    }

    const allowedAccounts = this.configService.get<string>('ACCOUNTS_ALLOW');

    if (allowedAccounts) {
      const allowedEmails = allowedAccounts.split(',').map(e => e.trim());
      if (!allowedEmails.includes(email)) {
        throw new UnauthorizedException('Este e-mail não tem permissão de acesso.');
      }
    }

    return { message: `O e-mail ${email} tem permissão.` };
  }
}
