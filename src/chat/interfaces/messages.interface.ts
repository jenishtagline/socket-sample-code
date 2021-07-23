import { Document } from 'mongoose'

export interface Messages extends Document {
    senderId: object;
    receiverId: object,
    isSeen: boolean,
    text: string,
}