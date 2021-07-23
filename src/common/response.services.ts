export const responseFn = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({ message, data })
}