const { tokenGenerate } = require('../common/jwt.service');
const { generateOtp, responseFn } = require('../common/util.service');
const { userModel } = require('../models/users.model');
const { connectionModel } = require('../models/connection.model');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { mail } = require('../common/mail.service');
const saltRounds = 10;
const signUpController = async (req, res) => {
    try {
        const userData = req.body
        const emailExist = await userModel.findOne({ email: userData.email })
        if (userData?.providerType?.toUpperCase() === 'NORMAL') {
            if (emailExist) {
                if (emailExist.isActive) return responseFn(res, 400, 'User Already Exist')
                if (!userData.password || userData.password.length <= 8) return responseFn(res, 400, 'Password length should be 8')
                emailExist.otp = generateOtp();

                const token = await tokenGenerate(userData.email, userData._id)
                emailExist.token = token
                await emailExist.save();
                const payload = {
                    email: emailExist.email,
                    subject: "Account Verification",
                    data: `<h1>Welcome</h1></br><p>Your Otp is : ${emailExist.otp} </p>`
                }
                await mail(payload)
                return responseFn(res, 200, 'SignUp Successfully', { username: emailExist.username, email: emailExist.email, dob: emailExist.dob, gender: emailExist.gender, token: emailExist.token })
            }
            const hashPassword = await bcrypt.hash(userData.password, saltRounds);
            userData.password = hashPassword;
            if (userData.gender) userData.gender = userData.gender.toLowerCase();
            userData.otp = generateOtp();
            const token = await tokenGenerate(userData.email, userData._id)
            userData.token = token
            const userObject = await userModel.create(userData)
            if (userObject) {
                const payload = {
                    email: userData.email,
                    subject: "Account Verification",
                    data: `<h1>Welcome</h1></br><p>Your Otp is : ${userData.otp} </p>`
                }
                await mail(payload)
                return responseFn(res, 200, 'SignUp Successfully', { username: userObject.username, email: userObject.email, dob: userObject.dob, gender: userObject.gender, token: userObject.token })
            } else {
                return responseFn(res, 400, 'SignUp Failed')
            }
        } else {
            if (userData.socialInfo) {
                if (!emailExist) {
                    userData.isActive = true
                    if (userData.gender) userData.gender = userData.gender.toLowerCase();
                    if (userData.providerType) userData.providerType = userData.providerType.toUpperCase();
                    const token = await tokenGenerate(userData.email, userData._id)
                    userData.token = token
                    if (userData.deviceType) userData.deviceType = userData.deviceType.toUpperCase();
                    const userObject = await userModel.create(userData)
                    return responseFn(res, 200, 'Login Successfully', { _id: userObject._id, email: userObject.email, token: userObject.token })
                } else {
                    emailExist.socialInfo = userData.socialInfo;
                    const token = await tokenGenerate(userData.email, userData._id)
                    emailExist.token = token
                    await emailExist.save();
                    return responseFn(res, 200, 'Login Successfully', { _id: emailExist._id, email: emailExist.email, token: emailExist.token })
                }
            }
        }
    } catch (error) {
        return responseFn(res, 500, error.message)
    }
}

const loginController = async (req, res) => {
    try {
        const { email, password, fcmToken, deviceuuid, deviceType } = req.body
        if (!(email && password)) return responseFn(res, 400, "Please Enter Data");

        const userData = await userModel.findOne({ email, isActive: true })
        if (!userData) return responseFn(res, 400, "User not Found");

        const comparePassword = await bcrypt.compare(password, userData.password)
        if (!comparePassword) return responseFn(res, 400, "Invalid Password")

        const token = await tokenGenerate(userData.email, userData._id)
        userData.token = token
        if (fcmToken) userData.fcmToken = fcmToken
        if (deviceuuid) userData.deviceuuid = deviceuuid
        if (deviceType) userData.deviceType = deviceType.toUpperCase();
        await userData.save()

        return responseFn(res, 200, "Login Successfully", { email: userData.email, _id: userData.id, token: userData.token })
    } catch (error) {
        return responseFn(res, 500, error.message)
    }
}

const userVerification = async (req, res) => {
    try {
        const { email, otp, fcmToken, deviceuuid, deviceType } = req.body
        const userData = await userModel.findOne({ email, providerType: "NORMAL" })
        if (!userData) return responseFn(res, 400, "User not Found");
        if (userData.otp !== otp) return responseFn(res, 400, "Invalid OTP");
        userData.isActive = true
        if (fcmToken) userData.fcmToken = fcmToken
        if (deviceuuid) userData.deviceuuid = deviceuuid
        if (deviceType) userData.deviceType = deviceType.toUpperCase();
        await userData.save()
        return responseFn(res, 200, "User verification Successfully")
    } catch (error) {
        return responseFn(res, 500, error.message)
    }
}

const getUser = async (req, res) => {
    try {
        if (!req.body.userId) return responseFn(res, 400, "User ID not Found");
        const userData = await userModel.findById(req.body.userId, { username: 1, email: 1, dob: 1, gender: 1 })
        return responseFn(res, 200, "get user Successfully", userData)
    } catch (error) {
        return responseFn(res, 500, error.message)
    }
}

const getUsers = async (req, res) => {
    try {
        let page = Number(req.query.page)
        let perPage = Number(req.query.perPage)
        const userData = await userModel.find({ isActive: true }, { username: 1, email: 1, dob: 1, gender: 1 }).sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage)
        return responseFn(res, 200, "Get All Users Successfully", userData)
    } catch (error) {
        return responseFn(res, 500, error.message)
    }
}
const getConnections = async (req, res) => {
    try {
        let { page, perPage, userId } = req.body
        if (!userId) return responseFn(res, 400, "User ID not Found");
        const userData = await connectionModel.find({ $or: [{ userId, isConnection: 'ACCEPTED' }, { connectionId: userId, isConnection: 'ACCEPTED' }] })
        const connectionIdArr = userData.map((data) => {
            if (data.userId == req.body.userId) return mongoose.Types.ObjectId(data.connectionId);
            return mongoose.Types.ObjectId(data.userId);
        })
        const userConnectionData = await userModel.find({ _id: { $in: connectionIdArr } }, { username: 1, email: 1, dob: 1, gender: 1 }).sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage)
        return responseFn(res, 200, "Get All Connections successfully", userConnectionData)
    } catch (error) {
        return responseFn(res, 500, error.message)
    }
}
const getPendingConnections = async (req, res) => {
    try {
        let { page, perPage, userId } = req.body
        if (!userId) return responseFn(res, 400, "User ID not Found");
        const userData = await connectionModel.find({ $or: [{ userId, isConnection: 'PENDING' }, { connectionId: userId, isConnection: 'PENDING' }] }).sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage)
        const connectionIdArr = userData.map((data) => {
            if (data.userId == userId) return mongoose.Types.ObjectId(data.connectionId);
            return mongoose.Types.ObjectId(data.userId);
        })
        const userConnectionData = await userModel.find({ _id: { $in: connectionIdArr } }, { username: 1, email: 1, dob: 1, gender: 1 })

        return responseFn(res, 200, "Get All Pending Connections successfully", userConnectionData)
    } catch (error) {
        return responseFn(res, 500, error.message)
    }
}
const sendConnectionsRequest = async (req, res) => {
    try {
        let { userId, connectionId, status = "PENDING" } = req.body
        console.log('req.obj :>> ', req.obj);
        status = status.toUpperCase();
        if (!(userId && connectionId && status)) return responseFn(res, 400, "Invalid User Information");
        let connectionExist = await connectionModel.findOne({ $or: [{ userId, connectionId }, { connectionId: userId, userId: connectionId }] })

        if (!connectionExist) {
            connectionExist = await connectionModel.create({ userId, connectionId, isConnection: status.toUpperCase() })
            return responseFn(res, 200, "Connection Request send successfully", { data: connectionExist, isRequest: 'PENDING' })
        }
        if (connectionExist?.isConnection === "PENDING") {
            if (status === "ACCEPTED") {
                connectionExist.isConnection = status.toUpperCase();
                await connectionExist.save();
                return responseFn(res, 200, "User Request Accept Successfully", { data: connectionExist, isRequest: 'ACCEPTED' })
            }
            if (status === "REJECTED") {
                connectionExist.isConnection = status.toUpperCase();
                await connectionExist.save();
                return responseFn(res, 200, "User Request Reject Successfully", { data: connectionExist, isRequest: 'REJECTED' })
            }
            return responseFn(res, 200, "A request has been sent", { data: connectionExist, isRequest: 'PENDING' })
        }
        if (connectionExist?.isConnection === "REJECTED") return responseFn(res, 200, "User Already Rejected Request", { data: connectionExist, isRequest: 'REJECTED' })
        return responseFn(res, 200, "User Already Accepted Request", { data: connectionExist, isRequest: 'ACCEPTED' })
    } catch (error) {
        return responseFn(res, 500, error.message)
    }
}


module.exports = { signUpController, loginController, userVerification, getUser, getUsers, getConnections, getPendingConnections, sendConnectionsRequest }