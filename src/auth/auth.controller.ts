import { Get } from '@nestjs/common';
import { Body, Controller, Post, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConnectionRequest, GetUsers, LoginForUsers, SignUpForUsers, VerificationForUsers } from './validation/auth.dto';

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
    @Post('verification')
    async verification(@Body(new ValidationPipe()) data: VerificationForUsers, @Req() req, @Res() res) {
        return await this.authService.userVerification(req, res)
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('getUser')
    async getUser(@Body(new ValidationPipe()) data: GetUsers, @Req() req, @Res() res) {
        return await this.authService.getUser(req, res)
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('getUsers')
    async getUsers(@Req() req, @Res() res) {
        return await this.authService.getUsers(req, res)
    }
    @UseGuards(AuthGuard('jwt'))
    @Post('getConnections')
    async getConnection(@Body(new ValidationPipe()) data: GetUsers, @Req() req, @Res() res) {
        return await this.authService.getConnections(req, res)
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('getPendingConnections')
    async getPendingConnection(@Body(new ValidationPipe()) data: GetUsers, @Req() req, @Res() res) {
        return await this.authService.getPendingConnections(req, res)
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('sendConnectionRequest')
    async connectionRequest(@Body(new ValidationPipe()) data: ConnectionRequest, @Req() req, @Res() res) {
        return await this.authService.sendConnectionsRequest(req, res)
    }
}

