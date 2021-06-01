import dotenv from 'dotenv';

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

dotenv.config();
const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.jvgf0.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority`;

@Module({
  imports: [MongooseModule.forRoot(URI)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
