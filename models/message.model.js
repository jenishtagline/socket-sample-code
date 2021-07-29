const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

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
module.exports.messageModel = mongoose.model('messages', messageSchema)