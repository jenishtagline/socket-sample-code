import { Injectable } from '@nestjs/common';
import { Request, Response } from "express";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from './interface/user.interface';
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { responseFn } from '../common/response.services';
import { generateOtp } from '../common/util.services';
import { mail } from '../common/mail.services';
import { Connections } from '../chat/interfaces/connections.interface';
import * as mongoose from 'mongoose';

const saltRounds = 10;

@Injectable()
export class AuthService {
    constructor(
        @InjectModel('users') private usersModel: Model<Users>,
        @InjectModel('connections') private connectionModel: Model<Connections>,
        private jwtService: JwtService
    ) { }

    async createUser(req: Request, res: Response) {
        try {
            const userData = req.body
            const emailExist = await this.usersModel.findOne({ email: userData.email })
            // Encrypt

            if (userData?.providerType && userData.providerType.toUpperCase() === 'NORMAL') {

                if (emailExist) {
                    if (emailExist.isActive) return responseFn(res, 400, 'User Already Exist')
                    if (!userData.password || userData.password.length <= 8) return responseFn(res, 400, 'Password length should be 8')
                    emailExist.otp = generateOtp();

                    const token = await this.createToken(userData.email, userData._id)
                    emailExist.token = token.accessToken
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
                userData.gender = userData.gender.toLowerCase();
                userData.otp = generateOtp();
                const token = await this.createToken(userData.email, userData._id)
                userData.token = token.accessToken
                const userObject = await this.usersModel.create(userData)
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
                        userData.gender = userData.gender.toLowerCase();
                        userData.providerType = userData.providerType.toUpperCase();
                        const token = await this.createToken(userData.email, userData._id)
                        userData.token = token.accessToken
                        if (userData.deviceType) userData.deviceType = userData.deviceType.toUpperCase();
                        const userObject = await this.usersModel.create(userData)
                        return responseFn(res, 200, 'Login Successfully', { _id: userObject._id, email: userObject.email, token: userObject.token })
                    } else {
                        emailExist.socialInfo = userData.socialInfo;
                        const token = await this.createToken(userData.email, userData._id)
                        emailExist.token = token.accessToken
                        await emailExist.save();
                        return responseFn(res, 200, 'Login Successfully', { _id: emailExist._id, email: emailExist.email, token: emailExist.token })
                    }
                }
            }
        } catch (error) {
            return responseFn(res, 500, error.message)
        }
    }

    async loginUser(req: Request, res: Response) {
        try {
            const { email, password, fcmToken, deviceuuid, deviceType } = req.body
            if (!(email && password)) return responseFn(res, 400, "Please Enter Data");

            const userData: any = await this.usersModel.findOne({ email, isActive: true })
            if (!userData) return responseFn(res, 400, "User not Found");

            const comparePassword = await bcrypt.compare(password, userData.password)
            if (!comparePassword) return responseFn(res, 400, "Invalid Password")

            const token = await this.createToken(userData.email, userData._id)
            userData.token = token.accessToken
            if (fcmToken) userData.fcmToken = fcmToken
            if (deviceuuid) userData.deviceuuid = deviceuuid
            if (deviceType) userData.deviceType = deviceType.toUpperCase();
            await userData.save()

            return responseFn(res, 200, "Login Success", { email: userData.email, _id: userData.id, token: userData.token })
        } catch (error) {
            return responseFn(res, 500, error.message)
        }
    }

    async userVerification(req: Request, res: Response) {
        try {
            const { email, otp, fcmToken, deviceuuid, deviceType } = req.body
            const userData: any = await this.usersModel.findOne({ email, providerType: "NORMAL" })
            if (!userData) return responseFn(res, 400, "User not Found");
            if (userData.otp !== otp) return responseFn(res, 400, "Invalid OTP");
            userData.isActive = true
            if (fcmToken) userData.fcmToken = fcmToken
            if (deviceuuid) userData.deviceuuid = deviceuuid
            if (deviceType) userData.deviceType = deviceType.toUpperCase();
            await userData.save()
            return responseFn(res, 200, "User verification Success")
        } catch (error) {
            return responseFn(res, 500, error.message)
        }
    }

    async createToken(userEmail: String, userId: String) {
        const payload = { email: userEmail, _id: userId }
        return { accessToken: this.jwtService.sign(payload) }
    }

    async validateUser(user: any) {
        return await this.usersModel.findOne({ email: user.email })
    }

    async getUser(req: Request, res: Response) {
        try {
            const userData = await this.usersModel.findById(req.body.userId, { username: 1, email: 1, dob: 1, gender: 1 })
            if (!userData) return responseFn(res, 400, "User not Found");
            return responseFn(res, 200, "get user Success", userData)
        } catch (error) {
            return responseFn(res, 500, error.message)
        }
    }
    async getUsers(req: Request, res: Response) {
        try {
            let page: any = Number(req.query.page)
            let perPage: any = Number(req.query.perPage)
            const userData = await this.usersModel.find({ isActive: true }, { username: 1, email: 1, dob: 1, gender: 1 }).sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage)
            if (!userData.length) return responseFn(res, 400, "User not Found");
            return responseFn(res, 200, "Get All Users Success", userData)
        } catch (error) {
            return responseFn(res, 500, error.message)
        }
    }
    async getConnections(req: Request, res: Response) {
        try {
            let { page, perPage, userId } = req.body
            const userData = await this.connectionModel.find({ $or: [{ userId, isConnection: 'ACCEPTED' }, { connectionId: userId, isConnection: 'ACCEPTED' }] })//.limit(50)
            const connectionIdArr = userData.map((data: any) => {
                if (data.userId == req.body.userId) return mongoose.Types.ObjectId(data.connectionId);
                return mongoose.Types.ObjectId(data.userId);
            })
            const userConnectionData = await this.usersModel.find({ _id: { $in: connectionIdArr } }, { username: 1, email: 1, dob: 1, gender: 1 }).sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage)

            return responseFn(res, 200, "Get All Connections successfully", userConnectionData)
        } catch (error) {
            return responseFn(res, 500, error.message)
        }
    }
    async getPendingConnections(req: Request, res: Response) {
        try {
            let { page, perPage, userId } = req.body
            const userData = await this.connectionModel.find({ $or: [{ userId, isConnection: 'PENDING' }, { connectionId: userId, isConnection: 'PENDING' }] })//.sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage)
            const connectionIdArr = userData.map((data: any) => {
                if (data.userId == userId) return mongoose.Types.ObjectId(data.connectionId);
                return mongoose.Types.ObjectId(data.userId);
            })
            const userConnectionData = await this.usersModel.find({ _id: { $in: connectionIdArr } }, { username: 1, email: 1, dob: 1, gender: 1 }).sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage)

            return responseFn(res, 200, "Get All Pending Connections successfully", userConnectionData)
        } catch (error) {
            return responseFn(res, 500, error.message)
        }
    }
    async sendConnectionsRequest(req: Request, res: Response) {
        try {
            let { userId, connectionId, status = "PENDING" } = req.body
            status = status.toUpperCase();
            if (!(userId && connectionId && status)) return responseFn(res, 400, "Invalid User Information");
            let connectionExist = await this.connectionModel.findOne({ $or: [{ userId, connectionId }, { connectionId: userId, userId: connectionId }] })

            if (!connectionExist) {
                connectionExist = await this.connectionModel.create({ userId, connectionId, isConnection: status.toUpperCase() })
                connectionExist.isConnection = status.toUpperCase();
                await connectionExist.save();
                return responseFn(res, 200, "Connection Request send successfully", { data: connectionExist, connectionStatus: 'PENDING' })
            }
            if (connectionExist?.isConnection === "PENDING") {
                if (status === "ACCEPTED") {
                    connectionExist.isConnection = status.toUpperCase();
                    await connectionExist.save();
                    return responseFn(res, 200, "User Request Accept Success", { data: connectionExist, connectionStatus: 'ACCEPTED' })
                }
                return responseFn(res, 200, "Already request sended", { data: connectionExist, connectionStatus: 'PENDING' })
            }
            return responseFn(res, 200, "User Already request Accept", { data: connectionExist, connectionStatus: 'ACCEPTED' })

        } catch (error) {
            return responseFn(res, 500, error.message)
        }
    }

}

