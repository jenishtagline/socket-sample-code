import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { userSchema } from './model/users.model';
import { jwtConstants } from 'src/common/jwt.constants';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'users', schema: userSchema, collection: 'users' },]),
        PassportModule.register({
            defaultStrategy: 'jwt',
            property: 'user',
            session: false,
        }),
        JwtModule.register({
            secret: jwtConstants.secret,
        })
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService, JwtModule]
})
export class AuthModule { }
