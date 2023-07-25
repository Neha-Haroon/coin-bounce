// is a validation middleware method

const JWTService = require("../services/JWTService")
const User = require("../models/user");
const UserDTO = require("../dto/user");


const auth = async (req, res, next) => {
    try {
        // 1. refresh, access token validation
        const { refreshToken, accessToken } = req.cookies;

        // if jahan user ne request bheji hai  usmein refresh token nahi hai cookie mein 
        // ya access token null hai 
        if (!refreshToken || !accessToken) {
            const error = {
                status: 401,
                message: 'Unauthorized'
            }
            return next(error)
        }
        let _id;
        try {
            _id = JWTService.verifyAccessToken(accessToken)._id;

        } catch (error) {
            return next(error)
        }

        let user;
        try {
            user = await User.findOne({ _id: _id })
        } catch (error) {
            return next(error)
        }

        const userDto = new UserDTO(user);

        req.user = userDto;

        next();

    }
    catch (error) {
        return next(error)
    }
}

module.exports = auth;