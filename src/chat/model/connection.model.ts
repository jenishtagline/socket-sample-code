import * as mongoose from 'mongoose';

export const connectionSchema = new mongoose.Schema({

    connectionId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    isConnection: {
        type: String,
        enum:['PENDING','ACCEPTED','REJECTED'],
        default: 'PENDING'
    },
    // status: {
    //     type: Boolean,
    //     default: false
    // },
    lastSeen: {
        type: Date
    },
    // isActive: {
    //     type: Boolean,
    //     default: false
    // }
}, { timestamps: true })