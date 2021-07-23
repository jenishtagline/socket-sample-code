import * as mongoose from 'mongoose';

export const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    password: {
        type: String,
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
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
    }

}, { timestamps: true })