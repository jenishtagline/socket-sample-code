import { Logger, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Model, Mongoose } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { Users } from 'src/auth/interface/user.interface';
import { Connections } from './interfaces/connections.interface';
import * as mongoose from 'mongoose';
import { Messages } from './interfaces/messages.interface';
import { config } from "dotenv";
config();
@WebSocketGateway(Number(process.env.SOCKET_PORT) || 4001, { cors: true })
export class ChatGateway {
  constructor(
    @InjectModel('users') private usersModel: Model<Users>,
    @InjectModel('connections') private connectionModel: Model<Connections>,
    @InjectModel('messages') private messageModel: Model<Messages>
  ) { }
  private logger: Logger = new Logger('AppGateways');
  @WebSocketServer() server: Server;
  afterInit(server: Server) {
    this.logger.log('server Started');
  }

  @SubscribeMessage('messages')
  async handleMessage(client: Socket, { senderId, receiverId, text, isSeen = false }: any) {
    if (!(senderId && receiverId && text)) return client.emit('messages', { statusCode: 400, message: "Invalid message information", data: [] })
    const connectionExist = await this.connectionModel.findOne({ $or: [{ userId: senderId, connectionId: receiverId, isConnection: 'ACCEPTED' }, { userId: receiverId, connectionId: senderId, isConnection: 'ACCEPTED' }] })
    if (!connectionExist) {
      return client.emit('messages', { statusCode: 400, message: "Connection Not found", data: [] })
    }
    const messageData = await this.messageModel.create({ senderId, receiverId, isSeen, text })
    console.log('messageData :>> ', messageData);
    client.emit('messages', { statusCode: 200, message: "message send successfully", data: messageData })
  }

  @SubscribeMessage('getMessages')
  async handleGetMessage(client: Socket, { senderId, receiverId }: any) {
    if (!(senderId && receiverId)) return client.emit('getMessages', { statusCode: 400, message: "Invalid message information", data: [] })
    const connectionExist = await this.connectionModel.findOne({ $or: [{ userId: senderId, connectionId: receiverId, isConnection: 'ACCEPTED' }, { userId: receiverId, connectionId: senderId, isConnection: 'ACCEPTED' }] })
    if (!connectionExist) {
      return client.emit('getMessages', { statusCode: 400, message: "Connection Not found", data: [] })
    }
    const messageData = await this.messageModel.find({ $or: [{ senderId, receiverId }, { senderId: receiverId, receiverId: senderId }] })
    return client.emit('getMessages', { statusCode: 200, message: "message send successfully", data: messageData })
  }

  @SubscribeMessage('getUser')
  async handleUser(client: Socket, payload: any) {
    const userData = await this.usersModel.findById(payload._id, { username: 1, email: 1, dob: 1, gender: 1 })
    return client.emit('getUser', { statusCode: 200, message: 'get User Successfully', data: userData });
  }

  // @SubscribeMessage('setConnection')
  // async handleSetConnection(client: Socket, { senderId, receiverId }: any) {
  //   try {
  //     if (!(senderId && receiverId)) return client.emit('setConnection', { statusCode: 400, message: "Invalid message information", data: [] })
  //     const connectionExist = await this.connectionModel.findOne({ $or: [{ userId: senderId, connectionId: receiverId, isConnection: 'ACCEPTED' }, { userId: receiverId, connectionId: senderId, isConnection: 'ACCEPTED' }] })
  //     if (!connectionExist) {
  //       return client.emit('setConnection', { statusCode: 400, message: "Connection Not found", data: [] })
  //     }
  //     await this.usersModel.findByIdAndUpdate(senderId, { isOnline: true }, { new: true })
  //     await this.messageModel.updateMany({ senderId: receiverId, receiverId: senderId }, { isSeen: true })
  //     client.emit('setConnection', { statusCode: 200, message: 'Connection set Successfully', data: [] });
  //   } catch (error) {
  //     return error.message
  //   }
  // }

  @SubscribeMessage('getUsers')
  async handleUserList(client: Socket, payload: any = {}) {
    const userData = await this.usersModel.find({ isActive: true }, { username: 1, email: 1, dob: 1, gender: 1 }).limit(50)
    return client.emit('getUsers', { statusCode: 200, message: "get Users successfully", data: userData });
  }

  @SubscribeMessage('getConnections')
  async handleConnections(client: Socket, { userId }: any) {
    const userData = await this.connectionModel.find({ $or: [{ userId: userId, isConnection: 'ACCEPTED' }, { connectionId: userId, isConnection: 'ACCEPTED' }] })//.limit(50)
    const connectionIdArr = userData.map((data: any) => {
      if (data.userId == userId) return mongoose.Types.ObjectId(data.connectionId);
      return mongoose.Types.ObjectId(data.userId);
    })
    const userConnectionData = await this.usersModel.find({ _id: { $in: connectionIdArr } }, { username: 1, email: 1, dob: 1, gender: 1 })
    return client.emit('getConnections', { message: "getConnections successfully", data: userConnectionData });
  }

  @SubscribeMessage('getPendingConnections')
  async handlePendingConnections(client: Socket, payload: any = {}) {
    const userData = await this.connectionModel.find({ $or: [{ userId: payload.userId, isConnection: 'PENDING' }, { connectionId: payload.userId, isConnection: 'PENDING' }] })//.limit(50)
    client.emit('getPendingConnections', { message: "getPendingConnections successfully", data: userData });
  }

  @SubscribeMessage('sendConnectionsRequest')
  async handleSendConnections(client: Socket, { userId, connectionId, status = "PENDING" }) {
    if (!(userId && connectionId && status)) return client.emit('sendConnectionsRequest', { statusCode: 400, message: "Invalid user information", data: [] })
    let connectionData = await this.connectionModel.findOne({ userId, connectionId })
    if (!connectionData) {
      connectionData = await this.connectionModel.create({ userId, connectionId, isConnection: status.toUpperCase() })
    } else {
      connectionData.isConnection = status.toUpperCase();
      await connectionData.save();
    }
    client.emit('sendConnectionsRequest', { statusCode: 200, message: "Send connections request successfully", data: connectionData });
  }
}
