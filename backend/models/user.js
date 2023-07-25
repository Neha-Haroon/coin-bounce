const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
},
    {
        timestamps: true
    }
)
// 'model-name' , modelSchema, "name for collection in db( kept plural )"
module.exports = mongoose.model('User', userSchema, 'users')