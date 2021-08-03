const jwt = require("jsonwebtoken");
const { userModel } = require("../models/users.model");

const tokenGenerate = (info, _id) => {
  return jwt.sign({ info, _id }, process.env.JWT_SECRET_KEY);
};

const tokenVerify = async (req, res, next) => {
  try {
    const token = req.headers["authorization"];
    console.log("token :>> ", token);
    if (!token) throw Error("Token not provided.");
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("decoded :>> ", decoded);
    if (decoded) {
      if (userData?.providerType === "APPLE") {
        req.obj = { socialInfo: userData.socialInfo, _id: userData._id };
        next();
      } else {
        throw new Error("Invalid user");
      }
      if (decoded?._id) {
        const userData = await userModel
          .findOne({ _id: decoded._id })
          .lean()
          .exec();

        if (userData) {
          if (userData?.providerType === "APPLE") {
            req.obj = { socialInfo: userData.socialInfo, _id: userData._id };
            next();
          }
          req.obj = { email: decoded.info, _id: decoded._id };
          next();
        } else {
          throw new Error("Invalid user");
        }
      }
    } else {
      throw new Error("Invalid token");
    }
  } catch (error) {
    return res.json({ statusCode: 401, message: error.message, data: null });
  }
};

module.exports = { tokenGenerate, tokenVerify };