import { ChatQueries } from './queries';
import { ChatMutations } from './mutations';

export class ChatService {
  static getConversations = ChatQueries.getConversations;
  static getMessages = ChatQueries.getMessages;
  static markConversationRead = ChatQueries.markConversationRead;
  static getUnreadCounts = ChatQueries.getUnreadCounts;

  static getOrCreateGroupConversation = ChatMutations.getOrCreateGroupConversation;
  static sendMessage = ChatMutations.sendMessage;
  static createConversation = ChatMutations.createConversation;
  static getOrCreateDirectConversation = ChatMutations.getOrCreateDirectConversation;
}

export { ChatQueries, ChatMutations };
