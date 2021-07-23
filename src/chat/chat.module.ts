import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { userSchema } from 'src/auth/model/users.model';
import { ChatGateway } from './chat.gateway';
import { connectionSchema } from './model/connection.model';
import { messageSchema } from './model/message.model';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'users', schema: userSchema, collection: 'users' },
      { name: 'messages', schema: messageSchema, collection: 'messages' },
      { name: 'connections', schema: connectionSchema, collection: 'connections' }
    ]),
  ],
  providers: [ChatGateway]
})
export class ChatModule { }
