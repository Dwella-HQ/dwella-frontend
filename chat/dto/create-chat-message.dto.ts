import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChatMessageDto {
  @IsUUID()
  chatId: string;

  @IsUUID()
  participantId: string;

  @IsString()
  content: string;

  @IsUUID('all', { each: true })
  @IsOptional()
  fileIds?: string[];
}
