import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from 'src/user/entities/user.entity';
import { USER_ROLES } from 'src/utils/constants';

@Entity()
export class ChatParticipant extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Chat, (chat) => chat.participants)
  chat: Relation<Chat>;

  @ManyToOne(() => User)
  user: Relation<User>;

  @Column({ type: 'text' })
  role: USER_ROLES;

  @Column()
  roleId: string;

  @Column({ default: false })
  isOnline: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
