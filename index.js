require('dotenv').config();
const express = require('express')
const app = express();
const cors = require('cors');
const http = require('http').createServer(app)
const usersRouter = require('./routes/users');
const db = require('./database');
const { connectionModel } = require('./models/connection.model');
const { messageModel } = require('./models/message.model');
let usersArr = [];
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: false }));
app.get('/', (req, res) => {
    res.send("Node Server is running. Yay!!")
})
app.use('/auth', usersRouter)

//Socket Logic
const socketio = require('socket.io')(http)

socketio.on("connection", (socket) => {
    addUsers(socket.handshake.query.userId, socket.id)
    socket.on('messages', async ({ senderId, receiverId, text, isSeen = false }) => {
        if (!(senderId && receiverId && text)) return socket.emit('messages', { statusCode: 400, message: "Invalid message information", data: [] })
        const connectionExist = await connectionModel.findOne({ $or: [{ userId: senderId, connectionId: receiverId, isConnection: 'ACCEPTED' }, { userId: receiverId, connectionId: senderId, isConnection: 'ACCEPTED' }] })
        if (!connectionExist) {
            return socket.emit('messages', { statusCode: 400, message: "Connection Not found", data: [] })
        }
        const connectionSocketId = [];
        usersArr.map((data) => {
            if (senderId === data.userId || receiverId === data.userId) {
                connectionSocketId.push(data.socketId);
            }
        })
        const messageData = await messageModel.create({ senderId, receiverId, isSeen, text })
        socketio.to(connectionSocketId).emit('messages', { statusCode: 200, message: "message send successfully", data: messageData })
    })
    socket.on('getMessages', async ({ senderId, receiverId, perPage = 0, page = 0 }) => {
        if (!(senderId && receiverId)) return socket.emit('getMessages', { statusCode: 400, message: "Invalid message information", data: [] })
        const connectionExist = await connectionModel.findOne({ $or: [{ userId: senderId, connectionId: receiverId, isConnection: 'ACCEPTED' }, { userId: receiverId, connectionId: senderId, isConnection: 'ACCEPTED' }] })
        if (!connectionExist) {
            return socket.emit('getMessages', { statusCode: 400, message: "Connection Not found", data: [] })
        }
        const messageData = await messageModel.find({ $or: [{ senderId, receiverId }, { senderId: receiverId, receiverId: senderId }] }).sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage)
        socket.emit('getMessages', { statusCode: 200, message: "get messages successfully", data: messageData })
    })
    socket.on('disconnect', () => {
        removeUsers(socket.id)
    })
})

const port = process.env.PORT || 5000;
console.log(`Server running on port ${port} 🔥`);
http.listen(port)
const addUsers = (userId, socketId) => {
    !usersArr.some((data) => data.userId === userId) &&
        usersArr.push({ socketId, userId })
}
const removeUsers = (socketId) => {
    usersArr = usersArr.filter((data) => data.socketId !== socketId)
}