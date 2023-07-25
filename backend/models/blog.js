const mongoose = require('mongoose');

const { Schema } = mongoose;

const blogSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    photoPath: {
        type: String,
        required: true
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
module.exports = mongoose.model('Blog', blogSchema, 'blogs')