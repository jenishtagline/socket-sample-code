import * as mongoose from 'mongoose';

export const messageSchema = new mongoose.Schema({

    senderId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    receiverId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    isSeen: {
        type: Boolean,
        default: false
    },
    text: {
        type: String,
        default: null
    }
}, { timestamps: true })
