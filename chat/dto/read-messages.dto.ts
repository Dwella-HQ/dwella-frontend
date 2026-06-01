import { IsUUID } from 'class-validator';

export class ReadMessagesDto {
  @IsUUID()
  chatId: string;

  @IsUUID('all', { each: true })
  messageIds: string[];
}
