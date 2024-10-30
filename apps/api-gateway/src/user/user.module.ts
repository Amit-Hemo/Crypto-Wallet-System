import { Services } from '@app/shared/general/services.contants';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './user.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: Services.USER,
        transport: Transport.TCP,
        options: {
          host: 'user-service',
          port: 3003,
        },
      },
    ]),
  ],
  controllers: [UserController],
})
export class UserModule {}
