import { Injectable } from '@nestjs/common';
import { Request, Response } from "express";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from './interface/user.interface';
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { responseFn } from 'src/common/response.services';
import { generateOtp } from 'src/common/util.services';
import { mail } from 'src/common/mail.services';

const saltRounds = 10;

@Injectable()
export class AuthService {
    constructor(@InjectModel('users') private usersModel: Model<Users>, private jwtService: JwtService) { }

    async createUser(req: Request, res: Response) {
        try {
            const userData = req.body
            // Check Email
            const emailExist = await this.usersModel.findOne({ email: userData.email })
            if (emailExist) return responseFn(res, 400, 'User Already Exist')
            // Encrypt
            const hashPassword = await bcrypt.hash(userData.password, saltRounds);
            userData.password = hashPassword;
            userData.gender = userData.gender.toLowerCase();
            userData.otp = generateOtp();

            const userObject = await this.usersModel.create(userData)
            if (userObject) {
                const payload = {
                    email: userData.email,
                    subject: "Account Verification",
                    data: `<h1>Welcome</h1></br><p>Your Otp is : ${userData.otp} </p>`
                }
                await mail(payload)
                return responseFn(res, 200, 'SignUp Successfully', { username: userObject.username, email: userObject.email, dob: userObject.dob, gender: userObject.gender })
            } else {
                return responseFn(res, 400, 'Singup Failed')
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
            const userData: any = await this.usersModel.findOne({ email })
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


}
