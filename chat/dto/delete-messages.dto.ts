import { IsUUID } from 'class-validator';

export class DeleteMessagesDto {
  @IsUUID()
  chatId: string;

  @IsUUID('all', { each: true })
  messageIds: string[];
}
