import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config } from "dotenv";
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
config();
@Module({
  imports: [AuthModule, MongooseModule.forRoot(process.env.MONGODB_URI), ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
