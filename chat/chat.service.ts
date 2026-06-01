/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Server } from 'socket.io';
import { UserService } from 'src/user/user.service';
import { TenantService } from 'src/tenant/tenant.service';
import { PropertyManagerService } from 'src/property-manager/property-manager.service';
import { LandlordService } from 'src/landlord/landlord.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { In, LessThan, Repository } from 'typeorm';
import { ChatParticipant } from './entities/chat-participant.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { USER_ROLES } from 'src/utils/constants';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import ms from 'ms';
import { GetChatMessagesDto } from './dto/get-chat-messages.dto';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { FileService } from 'src/file/file.service';
import { ReadMessagesDto } from './dto/read-messages.dto';
import { DeleteMessagesDto } from './dto/delete-messages.dto';
import { base64Encode } from 'src/utils/misc';

@Injectable()
export class ChatService {
  private server!: Server;

  constructor(
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    private readonly propertyManagerService: PropertyManagerService,
    private readonly landlordService: LandlordService,
    private readonly fileService: FileService,
    @InjectRepository(Chat) private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatParticipant)
    private readonly chatParticipantRepository: Repository<ChatParticipant>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  bindServer(server: Server) {
    this.server = server;
  }

  async getUserChatIds(roleId: string) {
    const cacheKey = `user:${roleId}:chatIds`;
    const cachedChatIds = await this.cacheManager.get<string[]>(cacheKey);
    if (cachedChatIds && cachedChatIds.length > 0) {
      return cachedChatIds;
    }
    const chatParticipants = await this.chatParticipantRepository.find({
      where: {
        roleId,
      },
      relations: {
        chat: true,
      },
    });
    const chatIds = chatParticipants.map((participant) => participant.chat.id);
    await this.cacheManager.set(cacheKey, chatIds, ms('1d') / 1000);
    return chatIds;
  }

  async create(createChatDto: CreateChatDto) {
    const chat = this.chatRepository.create({});
    const participantIds = createChatDto.participants
      .map((p) => p.roleId)
      .sort();
    const ref = base64Encode(participantIds.join('_'));
    const participants: ChatParticipant[] = [];
    // const existingChat = await this.chatRepository.findOne({
    //   where: {
    //     participants: {
    //       roleId: In(createChatDto.participants.map((p) => p.roleId)),
    //     },
    //   },
    //   relations: {
    //     participants: true,
    //   },
    // });
    for (const participantDto of createChatDto.participants) {
      let participant: ChatParticipant | undefined;
      if (participantDto.role === USER_ROLES.TENANT) {
        const tenant = await this.tenantService.findOne(participantDto.roleId);
        participant = this.chatParticipantRepository.create({
          user: tenant.user,
          role: participantDto.role,
          roleId: participantDto.roleId,
          chat,
        });
      }
      if (participantDto.role === USER_ROLES.PROPERTY_MANAGER) {
        const manager = await this.propertyManagerService.findOne(
          participantDto.roleId,
        );
        participant = this.chatParticipantRepository.create({
          user: manager.user,
          role: participantDto.role,
          roleId: participantDto.roleId,
          chat,
        });
      }
      if (participantDto.role === USER_ROLES.LANDLORD) {
        const landlord = await this.landlordService.findOne(
          participantDto.roleId,
        );
        participant = this.chatParticipantRepository.create({
          user: landlord.user,
          role: participantDto.role,
          roleId: participantDto.roleId,
          chat,
        });
      }
      if (!participant) {
        throw new BadRequestException(`Invalid participant`);
      }
      participants.push(participant);
    }
    chat.participants = participants;
    const savedChat = await this.chatRepository.save(chat);
    for (const participant of participants) {
      await this.cacheManager.del(`user:${participant.roleId}:chatIds`);
    }
    return savedChat;
  }

  async getUserChats(roleId: string) {
    const chatIds = await this.getUserChatIds(roleId);
    const chats = await this.chatRepository.find({
      where: {
        id: In(chatIds),
      },
      relations: {
        participants: {
          user: true,
        },
      },
    });
    this.server.to(`user:${roleId}`).emit('load:chats', chats);
    return chats;
  }

  async addChatMessage(createChatMessageDto: CreateChatMessageDto) {
    const chat = await this.findOne(createChatMessageDto.chatId);
    const participant = chat.participants.find(
      (p) => p.id === createChatMessageDto.participantId,
    );
    if (!participant) {
      throw new BadRequestException(`Invalid participant`);
    }
    const message = this.chatMessageRepository.create({
      chat,
      participant,
      content: createChatMessageDto.content,
    });
    if (
      createChatMessageDto.fileIds &&
      createChatMessageDto.fileIds.length > 0
    ) {
      const files = await Promise.all(
        createChatMessageDto.fileIds.map(async (fileId) => {
          const file = await this.fileService.findFileById(fileId);
          return file;
        }),
      );
      message.files = files;
    }
    const savedMessage = await this.chatMessageRepository.save(message);
    chat.lastMessage = {
      ...savedMessage,
      chat: undefined,
    };
    void this.dispatchMessages(chat.id);
    return savedMessage;
  }

  findAll() {
    return `This action returns all chat`;
  }

  async findOne(id: string) {
    const chat = await this.chatRepository.findOne({
      where: {
        id,
      },
      relations: {
        participants: {
          user: true,
        },
      },
    });
    if (!chat) {
      throw new BadRequestException(`Chat message not found`);
    }
    return chat;
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  async readMessages(readMessagesDto: ReadMessagesDto) {
    const results = await this.chatMessageRepository.update(
      {
        id: In(readMessagesDto.messageIds),
        chat: {
          id: readMessagesDto.chatId,
        },
      },
      {
        isRead: true,
      },
    );
    if (results.affected && results.affected > 0) {
      void this.dispatchMessages(readMessagesDto.chatId);
      return { message: `Messages marked as read successfully` };
    } else {
      throw new BadRequestException(`Messages not found`);
    }
  }

  async deleteMessages(deleteMessagesDto: DeleteMessagesDto) {
    const results = await this.chatMessageRepository.update(
      {
        id: In(deleteMessagesDto.messageIds),
        chat: {
          id: deleteMessagesDto.chatId,
        },
      },
      {
        isDeleted: true,
        content: '',
        files: [],
      },
    );
    if (results.affected && results.affected > 0) {
      void this.dispatchMessages(deleteMessagesDto.chatId);
      return { message: `Messages deleted successfully` };
    } else {
      throw new BadRequestException(`Messages not found`);
    }
  }

  async remove(id: string) {
    const result = await this.chatRepository.softDelete(id);
    if (result.affected && result.affected > 0) {
      return { message: `Chat ${id} removed successfully` };
    } else {
      throw new BadRequestException(`Chat not found`);
    }
  }

  async getChatMessages(getChatMessagesDto: GetChatMessagesDto) {
    const messages = await this.chatMessageRepository.find({
      where: {
        chat: {
          id: getChatMessagesDto.chatId,
          createdAt: getChatMessagesDto.cursor
            ? LessThan(getChatMessagesDto.cursor)
            : undefined,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      take: getChatMessagesDto.limit || 50,
    });
    this.server
      .to(`chat:${getChatMessagesDto.chatId}`)
      .emit('load:messages', messages);
    return messages;
  }

  async dispatchMessages(chatId: string, cursor?: Date, limit = 50) {
    const messages = await this.getChatMessages({
      chatId,
      cursor,
      limit,
    });
    this.server.to(`chat:${chatId}`).emit('load:messages', messages);
  }
}
