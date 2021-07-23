import { Document } from 'mongoose'

export interface Connections extends Document {
    connectionId: object;
    userId: object,
    isConnection: string,
    status: string,
    lastSeen: string
}