const jwt = require('jsonwebtoken')
const { userModel } = require('../models/users.model')

const tokenGenerate = (email, _id) => {
    return jwt.sign({ email, _id }, process.env.JWT_SECRET_KEY);
}

const tokenVerify = async (req, res, next) => {
    try {
        const token = req.headers['authorization']
        if (!token) throw Error('Token not provided.')
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        if (decoded?._id) {
            const userData = await userModel.findOne({ _id: decoded._id }).lean().exec();
            if (userData) {
                req.obj = { email: decoded.email, _id: decoded._id }
                next();
            }
            else {
                throw new Error('Invalid user')
            }
        }
        else {
            throw new Error('Invalid token')
        }
    } catch (error) {
        return res.json({ statusCode: 401, message: error.message, data: null })
    }

}

module.exports = { tokenGenerate, tokenVerify }