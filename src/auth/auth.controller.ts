import { Body, Controller, Post, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LoginForUsers, SignUpForUsers, VerificationForUsers } from './validation/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    //SignUp Users
    @Post('signup')
    async signUp(@Body(new ValidationPipe()) data: SignUpForUsers, @Req() req, @Res() res) {
        return await this.authService.createUser(req, res)
    }

    //Login Users
    @Post('login')
    async login(@Body(new ValidationPipe()) data: LoginForUsers, @Req() req, @Res() res) {
        return await this.authService.loginUser(req, res)
    }
    //Login Users
    @UseGuards(JwtStrategy)
    @Post('verification')
    async verification(@Body(new ValidationPipe()) data: VerificationForUsers, @Req() req, @Res() res) {
        return await this.authService.userVerification(req, res)
    }
}

