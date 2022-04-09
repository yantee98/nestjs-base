import { MailService } from '@/src/mail/services';
import { PasswordService, TokenService } from '@/src/utils/services';
import { Injectable } from '@nestjs/common';
import { UsersService } from '@v1/users/services';
import { CreateResetTokenDto, ResetPasswordDto } from '../dtos';

@Injectable()
export class ResetPasswordService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {
    // empty
  }

  public async create(createResetTokenDto: CreateResetTokenDto) {
    const user = await this.usersService.findOneOrFail({
      email: createResetTokenDto.email,
    });

    user.resetToken = null;
    user.resetToken = this.tokenService.generateResetPasswordToken(user);
    user.resetSentAt = new Date();
    await user.save();

    await this.mailService.sendUserResetPassword(user);

    return { resetToken: user.resetToken };
  }

  public async update(id: number, resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findOneOrFail({ id: id });
    user.resetToken = null;
    user.resetSentAt = null;
    user.password = await this.passwordService.hashPassword(
      resetPasswordDto.password,
    );
    return await user.save();
  }
}
