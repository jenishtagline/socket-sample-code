const express = require('express');
const { tokenVerify } = require('../common/jwt.service');
const { signUpController, loginController, userVerification, getUser, getUsers, getConnections, getPendingConnections, sendConnectionsRequest } = require('../controllers/user.controller');
const router = express.Router();

router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/signup', signUpController)
router.post('/login', loginController)
router.post('/verification', userVerification)
router.post('/getUser', tokenVerify, getUser)
router.get('/getUsers', tokenVerify, getUsers)
router.post('/getConnections', tokenVerify, getConnections)
router.post('/getPendingConnections', tokenVerify, getPendingConnections)
router.post('/sendConnectionRequest', tokenVerify, sendConnectionsRequest)


router.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json(err)
    }
    return res.status(500).json(err)
})
module.exports = router;