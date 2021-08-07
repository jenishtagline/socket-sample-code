const { tokenGenerate } = require("../common/jwt.service");
const { generateOtp, responseFn } = require("../common/util.service");
const { userModel } = require("../models/users.model");
const { connectionModel } = require("../models/connection.model");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { mail } = require("../common/mail.service");
const saltRounds = 10;

const signUpController = async (req, res) => {
  try {
    const userData = req.body;
    if (userData?.providerType?.toUpperCase() === "NORMAL") {
      if (!userData.email) return responseFn(res, 400, "Invalid Email");
      const emailExist = await userModel.findOne({ email: userData.email });
      if (emailExist) {
        if (emailExist.isActive)
          return responseFn(res, 400, "User Already Exist");
        if (!userData.password || userData.password.length < 8)
          return responseFn(res, 400, "Password length should be 8");
        emailExist.otp = generateOtp();

        const token = await tokenGenerate(emailExist.email, emailExist._id);
        emailExist.token = token;
        await emailExist.save();
        const payload = {
          email: emailExist.email,
          subject: "Account Verification",
          data: `<h1>Welcome</h1></br><p>Your Otp is : ${emailExist.otp} </p>`,
        };
        await mail(payload);
        return responseFn(res, 200, "SignUp Successfully", {
          _id: emailExist._id,
          username: emailExist.username,
          email: emailExist.email,
          dob: emailExist.dob,
          gender: emailExist.gender,
          token: emailExist.token,
        });
      }
      if (!userData.password || userData.password.length < 8 )
        return responseFn(res, 400, "Password length should be 8");
      const hashPassword = await bcrypt.hash(userData.password, saltRounds);
      userData.password = hashPassword;
      if (userData.gender) userData.gender = userData.gender.toLowerCase();
      userData.otp = generateOtp();
      const userObject = await userModel.create(userData);

      const token = tokenGenerate(userObject.email, userObject._id);
      userObject.token = token;
      await userObject.save();
      if (userObject) {
        const payload = {
          email: userData.email,
          subject: "Account Verification",
          data: `<h1>Welcome</h1></br><p>Your Otp is : ${userData.otp} </p>`,
        };
        await mail(payload);
        return responseFn(res, 200, "SignUp Successfully", {
          _id: userObject._id,
          username: userObject.username,
          email: userObject.email,
          dob: userObject.dob,
          gender: userObject.gender,
          token: userObject.token,
        });
      } else {
        return responseFn(res, 400, "SignUp Failed");
      }
    } else {
      if (userData.socialInfo) {
        if (userData?.providerType?.toUpperCase() === "APPLE") {
          const userExist = await userModel.findOne({
            socialInfo: userData.socialInfo,
          });
          if (userExist) {
            if (userData.email) userExist.email = userData.email;
            const token = tokenGenerate(
              userExist.socialInfo,
              userExist._id
            );
            userExist.token = token;
            await userExist.save();
            return responseFn(res, 200, "Login Successfully", {
              _id: userExist._id,
              socialInfo: userExist.socialInfo,
              token: userExist.token,
            });
          }
          if (userData?.email) {
            const emailExist = await userModel.findOne({ email: userData.email });
            if (emailExist) return responseFn(res, 400, "User Exist");
          }
          userData.isActive = true;
          if (userData.providerType)
            userData.providerType = userData.providerType.toUpperCase();
          if (userData.deviceType)
            userData.deviceType = userData.deviceType.toUpperCase();
          const userObject = await userModel.create(userData);
          const token = tokenGenerate(
            userObject.socialInfo,
            userObject._id
          );
          userObject.token = token;
          await userObject.save();
          return responseFn(res, 200, "Login Successfully", {
            _id: userObject._id,
            socialInfo: userObject.socialInfo,
            token: userObject.token,
          });
        }
        const emailExist = await userModel.findOne({ email: userData.email });
        if (!emailExist) {
          userData.isActive = true;
          if (userData.gender) userData.gender = userData.gender.toLowerCase();
          if (userData.providerType)
            userData.providerType = userData.providerType.toUpperCase();
          if (userData.deviceType)
            userData.deviceType = userData.deviceType.toUpperCase();
          const userObject = await userModel.create(userData);
          const token = tokenGenerate(userData.email, userObject._id);
          userObject.token = token;
          await userObject.save();
          return responseFn(res, 200, "Login Successfully", {
            _id: userObject._id,
            email: userObject.email,
            token: userObject.token,
          });
        } else {
          emailExist.socialInfo = userData.socialInfo;
          const token = tokenGenerate(emailExist.email, emailExist._id);
          emailExist.token = token;
          await emailExist.save();
          return responseFn(res, 200, "Login Successfully", {
            _id: emailExist._id,
            email: emailExist.email,
            token: emailExist.token,
          });
        }
      }
    }
  } catch (error) {
    return responseFn(res, 500, error.message);
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password, fcmToken, deviceuuid, deviceType } = req.body;
    if (!(email && password))
      return responseFn(res, 400, "Invalid credentials");

    const userData = await userModel.findOne({ email, isActive: true });
    if (!userData) return responseFn(res, 400, "User not Found");
    if (userData?.providerType!=="NORMAL") return responseFn(res, 400,"Invalid email and password")
    const comparePassword = await bcrypt.compare(password, userData.password);
    if (!comparePassword) return responseFn(res, 400, "Invalid Password");

    const token = tokenGenerate(userData.email, userData._id);
    userData.token = token;
    if (fcmToken) userData.fcmToken = fcmToken;
    if (deviceuuid) userData.deviceuuid = deviceuuid;
    if (deviceType) userData.deviceType = deviceType.toUpperCase();
    await userData.save();

    return responseFn(res, 200, "Login Successfully", {
      email: userData.email,
      _id: userData.id,
      token: userData.token,
    });
  } catch (error) {
    return responseFn(res, 500, error.message);
  }
};

const userVerification = async (req, res) => {
  try {
    const { email, otp, fcmToken, deviceuuid, deviceType } = req.body;
    const userData = await userModel.findOne({ email, providerType: "NORMAL" });
    if (!userData) return responseFn(res, 400, "User not Found");
    if (userData.otp !== otp) return responseFn(res, 400, "Invalid OTP");
    userData.isActive = true;
    if (fcmToken) userData.fcmToken = fcmToken;
    if (deviceuuid) userData.deviceuuid = deviceuuid;
    if (deviceType) userData.deviceType = deviceType.toUpperCase();
    await userData.save();
    return responseFn(res, 200, "User verification Successfully");
  } catch (error) {
    return responseFn(res, 500, error.message);
  }
};

const getUser = async (req, res) => {
  try {
    if (!req.body.userId) return responseFn(res, 400, "User ID not Found");
    const userData = await userModel.findById(req.body.userId, {
      username: 1,
      email: 1,
      dob: 1,
      gender: 1,
    });
    return responseFn(res, 200, "get user Successfully", userData);
  } catch (error) {
    return responseFn(res, 500, error.message);
  }
};

const getUsers = async (req, res) => {
  try {
    //     let page = Number(req.query.page)
    //     let perPage = Number(req.query.perPage)
    //     const userData = await userModel.find({ isActive: true }, { username: 1, email: 1, dob: 1, gender: 1 }).sort({ createdAt: -1 }).skip(perPage * (page - 1)).limit(perPage)

    //     return responseFn(res, 200, "Get All Users Successfully", userData)
    // } catch (error) {
    //     return responseFn(res, 500, error.message)
    // }
    let page = Number(req.query.page);
    let perPage = Number(req.query.perPage);

    const connectedUserData = await connectionModel.find({
      $or: [
        {
          userId: mongoose.Types.ObjectId(req.obj._id),
          isConnection: "PENDING",
        },
        {
          connectionId: mongoose.Types.ObjectId(req.obj._id),
          isConnection: "PENDING",
        },
        {
          userId: mongoose.Types.ObjectId(req.obj._id),
          isConnection: "ACCEPTED",
        },
        {
          connectionId: mongoose.Types.ObjectId(req.obj._id),
          isConnection: "ACCEPTED",
        },
      ],
    });

    const connectionIdArr = connectedUserData.map((data) => {
      if (data.userId == req.obj._id)
        return {
          userId: mongoose.Types.ObjectId(data.userId),
          connectionId: mongoose.Types.ObjectId(data.connectionId),
          isConnection: data.isConnection,
        };
      return {
        connectionId: mongoose.Types.ObjectId(data.connectionId),
        userId: mongoose.Types.ObjectId(data.userId),
        isConnection: data.isConnection,
      };
    });
    console.log("connectionIdArr :>> ", connectionIdArr);
    const userData = await userModel
      .find(
        { _id: { $nin: [req.obj._id] }, isActive: true },
        { username: 1, email: 1, dob: 1, gender: 1 }
      )
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);
    // const getUsersInfo = userData.map((data) => {
    //   const connectionInfo = connectionIdArr.find(
    //     ({ connectionId }) => connectionId === data._id
    //   );
    //   const payload = {
    //     userInfo: data._doc,
    //     connectionInfo,
    //   };
    //   return payload;
    // });
    // console.log('getUsersInfo :>> ', getUsersInfo);
    //     const userData = await userModel
    //         .find(
    //             { _id: { $nin: [...connectionIdArr, req.obj._id] }, isActive: true },
    //             { username: 1, email: 1, dob: 1, gender: 1 }
    //         )
    //         .sort({ createdAt: -1 })
    //         .skip(perPage * (page - 1))
    //         .limit(perPage);
    return responseFn(res, 200, "Get All Users Successfully", {
      connectionIdArr,
      userData,
    });
  } catch (error) {
    return responseFn(res, 500, error.message);
  }
};

const getConnections = async (req, res) => {
  try {
    let { page, perPage, userId } = req.body;
    if (!userId) return responseFn(res, 400, "User ID not Found");
    const userData = await connectionModel.find({
      $or: [
        { userId, isConnection: "ACCEPTED" },
        { connectionId: userId, isConnection: "ACCEPTED" },
      ],
    });
    const connectionIdArr = userData.map((data) => {
      if (data.userId == req.body.userId)
        return mongoose.Types.ObjectId(data.connectionId);
      return mongoose.Types.ObjectId(data.userId);
    });
    const userConnectionData = await userModel
      .find(
        { _id: { $in: connectionIdArr } },
        { username: 1, email: 1, dob: 1, gender: 1 }
      )
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);
    return responseFn(
      res,
      200,
      "Get All Connections successfully",
      userConnectionData
    );
  } catch (error) {
    return responseFn(res, 500, error.message);
  }
};
const getPendingConnections = async (req, res) => {
  try {
    let { page, perPage, userId } = req.body;
    if (!userId) return responseFn(res, 400, "User ID not Found");
    const userData = await connectionModel
      .find(
        {
          $or: [
            {
              userId: mongoose.Types.ObjectId(userId),
              isConnection: "PENDING",
            },
            {
              connectionId: mongoose.Types.ObjectId(userId),
              isConnection: "PENDING",
            },
          ],
        },
        { userId: 1, connectionId: 1, isConnection: 1 }
      )
      .populate({
        path: "connectionId",
        model: "users",
        select: { username: 1, email: 1, dob: 1, gender: 1 },
      })
      .populate({
        path: "userId",
        model: "users",
        select: { username: 1, email: 1, dob: 1, gender: 1 },
      })
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage);
    // const connectionIdArr = userData.map((data) => {
    //     if (data.userId == userId) return mongoose.Types.ObjectId(data.connectionId);
    //     return mongoose.Types.ObjectId(data.userId);
    // })
    // const userConnectionData = await userModel.find({ _id: { $in: connectionIdArr } }, { username: 1, email: 1, dob: 1, gender: 1 })

    return responseFn(
      res,
      200,
      "Get All Pending Connections successfully",
      userData
    );
  } catch (error) {
    return responseFn(res, 500, error.message);
  }
};
const sendConnectionsRequest = async (req, res) => {
  try {
    let { userId, connectionId, status = "PENDING" } = req.body;
    if (req.obj._id != userId) return responseFn(res, 400, "Invalid User");
    status = status.toUpperCase();
    if (!(userId && connectionId && status))
      return responseFn(res, 400, "Invalid User Information");
    let connectionExist = await connectionModel.findOne({
      $or: [
        { userId, connectionId },
        { connectionId: userId, userId: connectionId },
      ],
    });

    if (!connectionExist) {
      if (status !== "PENDING") return responseFn(res, 400, "User Connection Not Found");
      connectionExist = await connectionModel.create({
        userId,
        connectionId,
        isConnection: status.toUpperCase(),
      });
      return responseFn(res, 200, "Connection Request send successfully", {
        data: connectionExist,
        isRequest: "PENDING",
      });
    }
    if (connectionExist?.isConnection === "PENDING") {
      if (status === "ACCEPTED") {
        if (userId == connectionExist.connectionId) {
          connectionExist.isConnection = status.toUpperCase();
          await connectionExist.save();
          return responseFn(res, 200, "User Request Accept Successfully", {
            data: connectionExist,
            isRequest: "ACCEPTED",
          });
        } else {
          return responseFn(res, 400, "Invalid User Request");
        }
      }
      if (status === "REJECTED") {
        if (userId == connectionExist.connectionId) {
          connectionExist.isConnection = status.toUpperCase();
          await connectionExist.save();
          return responseFn(res, 200, "User Request Reject Successfully", {
            data: connectionExist,
            isRequest: "REJECTED",
          });
        } else {
          return responseFn(res, 400, "Invalid User Request");
        }
      }
      return responseFn(res, 200, "A request has been sent", {
        data: connectionExist,
        isRequest: "PENDING",
      });
    }
    if (status === "PENDING" && connectionExist?.isConnection === "REJECTED") {
      connectionExist.isConnection = status.toUpperCase();
      await connectionExist.save();
      return responseFn(res, 200, "Connection Request send successfully", {
        data: connectionExist,
        isRequest: "PENDING",
      });
    }
    return responseFn(res, 400, "User Already Accepted Request", {
      data: connectionExist,
      isRequest: "ACCEPTED",
    });
  } catch (error) {
    return responseFn(res, 500, error.message);
  }
};

module.exports = {
  signUpController,
  loginController,
  userVerification,
  getUser,
  getUsers,
  getConnections,
  getPendingConnections,
  sendConnectionsRequest,
};
