const mongoose = require('mongoose');

const { Schema } = mongoose;

const commentSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    blog: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Blog' // have to pass model name in ref
    },
    author: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
},
    {
        timestamps: true
    }
)
// 'model-name( needed for backend )' , modelSchema, "name for collection in db( kept plural )"
module.exports = mongoose.model('Comment', commentSchema, 'comments')