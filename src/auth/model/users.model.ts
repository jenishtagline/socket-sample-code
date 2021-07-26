import * as mongoose from 'mongoose';

export const userSchema = new mongoose.Schema({

    username: {
        type: String,
        default: null
    },
    email: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        default: null
    },
    password: {
        type: String,
    },
    gender: {
        type: String,
        enum: ['male', 'female','other'],
        default:'other'
    },
    isActive: {
        type: Boolean,
        default: false
    },
    // isOnline: {
    //     type: Boolean,
    //     default: false
    // },
    token: {
        type: String,
        default: null,
    },
    otp: {
        type: Number,
        default: null,
    },
    fcmToken: {
        type: String,
        default: null
    },
    deviceuuid: {
        type: String,
        default: null
    },
    deviceType: {
        type: String,
        enum: ['ANDROID', 'IPHONE'],
        default: 'ANDROID'
    },
    providerType: {
        type: String,
        enum: ['FB', 'GOOGLE', 'APPLE', 'NORMAL'],
        default: 'NORMAL'
    },
    socialInfo: {
        type: String,
        default: null
    }

}, { timestamps: true })