import { IsUUID } from 'class-validator';
import { QueryPaginationDto } from 'src/utils/query-pagination.dto';

export class GetChatMessagesDto extends QueryPaginationDto {
  @IsUUID()
  chatId: string;
}
