import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { USER_ROLES } from 'src/utils/constants';

export class ChatParticipantDto {
  @IsUUID()
  roleId: string;

  @IsEnum(USER_ROLES)
  role: USER_ROLES;
}

export class CreateChatDto {
  @Type(() => ChatParticipantDto)
  @ValidateNested({ each: true })
  @IsArray()
  @ArrayMinSize(2, { message: 'A chat must have at least 2 participants' })
  participants!: ChatParticipantDto[];
}
