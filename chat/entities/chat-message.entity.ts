import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ChatParticipant } from './chat-participant.entity';
import { Chat } from './chat.entity';
import { File } from 'src/file/entities/file.entity';

@Entity()
export class ChatMessage extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Chat, { eager: true })
  chat: Relation<Chat>;

  @ManyToOne(() => ChatParticipant, { eager: true })
  participant: Relation<ChatParticipant>;

  @Column()
  content: string;

  @OneToMany(() => File, (file) => file.chatMessage, { eager: true })
  files: Relation<File[]>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
