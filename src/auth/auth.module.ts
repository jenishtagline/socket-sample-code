import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { userSchema } from './model/users.model';
import { jwtConstants } from '../common/jwt.constants';
import { messageSchema } from '../chat/model/message.model';
import { connectionSchema } from '../chat/model/connection.model';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'users', schema: userSchema, collection: 'users' },
            { name: 'messages', schema: messageSchema, collection: 'messages' },
            { name: 'connections', schema: connectionSchema, collection: 'connections' }
        ]),
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
