import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { userSchema } from '../auth/model/users.model';
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
