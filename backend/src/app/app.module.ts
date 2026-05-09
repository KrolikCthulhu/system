import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
      isGlobal: true,
      //   ignoreEnvFile: !IS_DEV_ENV,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
