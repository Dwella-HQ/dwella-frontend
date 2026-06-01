import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { Chat } from './entities/chat.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { TenantModule } from 'src/tenant/tenant.module';
import { LandlordModule } from 'src/landlord/landlord.module';
import { PropertyManagerModule } from 'src/property-manager/property-manager.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatParticipant, ChatMessage]),
    UserModule,
    TenantModule,
    LandlordModule,
    PropertyManagerModule,
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
