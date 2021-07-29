const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000);
}


const responseFn = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({ message, data })
}

module.exports = { generateOtp, responseFn }