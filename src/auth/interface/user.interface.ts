import { Document } from 'mongoose'

export interface Users extends Document {
    socialInfo: any;
    token: string;
    username: string,
    email: string,
    dob: string,
    password: string,
    gender: string,
    createdAt: Date,
    updatedAt: Date,
    isActive: boolean,
    otp: number,
}