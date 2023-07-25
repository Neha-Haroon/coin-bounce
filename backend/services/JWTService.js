const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = require('../config/index')
const { REFRESH_TOKEN_SECRET } = require('../config/index')
const RefreshToken = require('../models/token');



// access token expires very fast as compared to refresh token
// making all the methods static so that whenevr we import the class methods we dont have to create new object

class JWTService {

    // 1. sign access token

    static signAccessToken(payload, expiryTime) {
        return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: expiryTime })
    }

    //  2. sign refresh token

    static signRefreshToken(payload, expiryTime) {
        return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: expiryTime })
    }

    // 3. verify access token

    static verifyAccessToken(token) {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    }

    // 4. verify refresh token

    static verifyRefreshToken(token) {
        // returns payload
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    }

    // 5. store refresh token

    static async storeRefreshToken(token, userId) {
        try {
            const newToken = new RefreshToken({
                token: token,
                userId: userId
            })

            // store in db
            await newToken.save()
        }
        catch (error) {
            console.log(error)
        }
    }
}

// exporting class
module.exports = JWTService;