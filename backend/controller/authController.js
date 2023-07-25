// whenever a request comes our controller will execute and handle that logi

const Joi = require('joi'); // for user validation
const User = require('../models/user');
const bcrypt = require('bcryptjs'); // for hash maps
const UserDTO = require('../dto/user');
const JWTService = require('../services/JWTService');
const RefreshToken = require("../models/token")

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;




//controller  object ={}
const authController = {
    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    async register(req, res, next) {

        // .1 --------------------- validate user input

        // define to validate schema
        // we expect user data to be in such form
        const userRegisterSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            name: Joi.string().max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattern).required(),
            confirmPassword: Joi.ref('password')
        });
        // check for validation
        const { error } = userRegisterSchema.validate(req.body);

        // 2. --------------------- error in validation -> return error via middleware
        // (means user input  value not null just incorrect)

        if (error) {
            // next kiya hai? yeh agla middleware call kardega
            return next(error);
        }

        // 3. --------------------- if email or username is already registered -> return an error

        // take the input data of registering user
        const { username, name, email, password } = req.body;

        try {
            // check if the input username is used by any existing users
            const usernameInUse = await User.exists({ username })

            // check if the input email is used by any existing users
            const emailInUse = await User.exists({ email })


            // if username is taken === true:
            if (usernameInUse) {
                // error object{}
                const error = {
                    // status code for conflict (this that is already in our db)
                    status: 409,

                    message: 'Username is already registered, use another username!'
                }
                return next(error);
            }

            // if email is taken === true:
            if (emailInUse) {
                // error object{}
                const error = {
                    // status code for conflict (this that is already in our db)
                    status: 409,

                    message: 'Email is already registered, use another email!'
                }
                return next(error);
            }

        }
        // if there is some other error like db connection fail or something:
        catch (error) {
            return next(error)
        }

        // if we are still in this func that means that we have validated user data and username and email are unique

        // 4. --------------------- password hash

        // 123abc ->dafjdlkfh a39u494398%#WEW$%%&%$#54256563%$^$#@%
        // means we wont save password as inputed rather we will hash it 
        // it will be irreversible (password to hash is possible not vice versa)
        // a string will always give the same hash so we will generate a hash at time of user login 
        // iF ( hash - register === hash - login  ? grant access : deny access)

        // here 10 tells 10 sorting rounds (is for additional security) can enter a number or string
        const hashedPassword = await bcrypt.hash(password, 10)

        // 5. --------------------- store user data in db

        let accessToken;
        let refreshToken;
        let user;

        try {
            // if key value pair has same value dont need to write both can work with only one (name :name X           name v)
            const userToRegister = new User({
                username,
                name,
                email,
                password: hashedPassword
            })

            // save user in db
            user = await userToRegister.save();

            // token generation
            // 30 mins
            accessToken = JWTService.signAccessToken({ _id: user._id }, '30m');
            refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m');
        }
        catch (error) {
            return next(error);
        }

        // store refresh token in db
        await JWTService.storeRefreshToken(refreshToken, user._id);


        // sending access and refresh tokens to our cookies
        // so res.cookie('key':value) whatever our value ( token ) holds will be saved in key named cookie
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24,   //expire time for cookie ( 1000ms )1sec * ( 60s )1min * ( 60m )1hr * ( 24hr )1day * (1week)1week
            httpOnly: true // for security reasons only means clientside js (browser )cant access . only when client sides refresh token comes to our backend only then can we access it . help reduce vulnerability from xss attacks
        });

        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24,   //expire time for cookie ( 1000ms )1sec * ( 60s )1min * ( 60m )1hr * ( 24hr )1day * (1week)1week
            httpOnly: true // for security reasons only means clientside js (browser )cant access . only when client sides refresh token comes to our backend only then can we access it . help reduce vulnerability from xss attacks
        });

        // 6. --------------------- response send
        // user :user

        const userDto = new UserDTO(user)

        return res.status(201).json({ user: userDto, auth: true });
    },


    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    async login(req, res, next) {
        // 1. validate user input
        // 2. if validation error, retrun error with middleware
        // 3.else match username and password with db if not match return error msg
        // 4. return response

        // define a login validate schema
        const userLoginSchema = Joi.object({

            username: Joi.string().min(5).max(30).required(), // should be consistent with userRegisterSchema 
            password: Joi.string().pattern(passwordPattern),
        });

        const { error } = userLoginSchema.validate(req.body)

        // if validation fails
        if (error) {
            return next(error)
        }
        // if validation passes
        else {

            // username = req.body.username
            // password = req.body.password shortcut below:
            const { username, password } = req.body;

            let user;
            try {
                // match username
                user = await User.findOne({ username });

                // if user === null (not found):
                if (!user) {
                    // error object{}
                    const error = {
                        status: 401,

                        message: 'Invalid Username!'
                    }
                    return next(error);
                }
                // means we got such username account 
                else {
                    // match password

                    // req.body.password to be hased and matched with the found username objects password
                    // req.body.password -> hased -> matched

                    // (login-input-password(not hashed, user-password-in-db(hased)))
                    const match = await bcrypt.compare(password, user.password);

                    // if match === null (not matched ):
                    if (!match) {
                        // error object{}
                        const error = {
                            status: 401,

                            message: 'Invalid Password!'
                        }
                        return next(error);
                    }

                    // if reached here meean both username and password are matched
                }
            }
            catch (error) {
                return next(error);
            }

            const accessToken = JWTService.signAccessToken({ _id: user._id }, '30m');
            const refreshToken = JWTService.signRefreshToken({ _id: user._id }, '60m');

            // update refresh token in database
            try {
                await RefreshToken.updateOne(
                    { _id: user._id },
                    { token: refreshToken },
                    { upsert: true } // means if agar token koi matching record mile ga toh wo usko refresh kar lega  OR if usko matching record nahi milta toh wo ek new  record insert kardega
                )
            } catch (error) {
                return next(error);
            }

            // sending tokens to cooke
            res.cookie('accessToken', accessToken, {
                maxAge: 1000 * 60 * 60 * 24,   //expire time for cookie ( 1000ms )1sec * ( 60s )1min * ( 60m )1hr * ( 24hr )1day * (1week)1week
                httpOnly: true // for security reasons only means clientside js (browser )cant access . only when client sides refresh token comes to our backend only then can we access it . help reduce vulnerability from xss attacks

            });
            res.cookie('refreshToken', refreshToken, {
                maxAge: 1000 * 60 * 60 * 24,   //expire time for cookie ( 1000ms )1sec * ( 60s )1min * ( 60m )1hr * ( 24hr )1day * (1week)1week
                httpOnly: true // for security reasons only means clientside js (browser )cant access . only when client sides refresh token comes to our backend only then can we access it . help reduce vulnerability from xss attacks

            });
            const userDto = new UserDTO(user);

            return res.status(200).json({ user: userDto, auth: true });
        }
    },


    // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    async logout(req, res, next) {

        // havent done validation here will use a middleware form of validation take bar bar use kar saken

        console.log(req);
        // 1. delete refresh token from db
        const { refreshToken } = req.cookies;

        try {
            await RefreshToken.deleteOne({ token: refreshToken });
        } catch (error) {
            return next(error);
        }

        // delete cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');


        // 2. response
        // logout success full toh 200  
        // auth key is beneficial for frontend
        res.status(200).json({ user: null, auth: false });
    },
    async refresh(req, res, next) {
        // 1. get refreshToken from cookies
        // 2.  verify refreshToken
        // 3. generate new tokens
        // 4. update db, return response

        const originalRefreshToken = req.cookies.refreshToken;
        let id;
        try {
            id = JWTService.verifyRefreshToken(originalRefreshToken)._id;
        } catch (e) {
            const error = {
                status: 401,
                message: 'unauthorized'
            }
            return next(error)
        }

        try {
            const match = RefreshToken.findOne({ _id: id, token: originalRefreshToken });

            // if match is not found then
            if (!match) {
                const error = {
                    status: 401,
                    message: 'unauthorized'
                }
            }
        } catch (e) {
            return next(e)
        }

        // 3.
        try {
            const accessToken = JWTService.signAccessToken({ _id: id }, '30m');

            const refreshToken = JWTService.signRefreshToken({ _id: id }, '60m');

            await RefreshToken.updateOne({ _id: id }, { token: refreshToken })

            res.cookie('accessToken', accessToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            })

            res.cookie('refreshToken', refreshToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            })

        } catch (e) {
            return next(e);
        }

        const user = await User.findOne({ _id: id });

        const userDto = new UserDTO(user);

        return res.status(200).json({ user: userDto, auth: true })
    }
}

module.exports = authController;