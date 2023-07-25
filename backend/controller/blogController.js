const Joi = require('joi');
const fs = require('fs');
const Blog = require('../models/blog');
const Comment = require('../models/comment');
const { BACKEND_SERVER_PATH } = require('../config/index')
const BlogDTO = require('../dto/blog');
const BlogDetailsDTO = require('../dto/blog-details');

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const blogController = {
    async create(req, res, next) {
        // 1. validate req body (joi)
        // 2. handle photo storage, naming
        // 3. addd to db
        // 4. return response

        // client side -> base64 encoded string  ->decode at backend ->store -> save photos path in db
        const createBlogSchema = Joi.object({
            title: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            content: Joi.string().required(),
            photo: Joi.string().required()
        })

        const { error } = createBlogSchema.validate(req.body);

        if (error) {
            return next(error);
        }
        // agar koi error nahi hai the... ->
        const { title, author, content, photo } = req.body;

        // photo processing steps
        // a. read as buffer
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64')
        // b. allot a random name
        const imagePath = `${ Date.now() }-${ author }.png` // toh jo bhi img hogaa usko hum as png save karwaenge { this will be the naming convention}
        // c. save locally
        try {
            fs.writeFileSync(`storage/${ imagePath }`, buffer);
        } catch (error) {
            return next(error);
        }
        // 3.
        let newBlog
        try {
            newBlog = new Blog({
                title,
                author,
                content,
                photoPath: `${ BACKEND_SERVER_PATH }/storage/${ imagePath }`
            });
            await newBlog.save();

        }
        catch (error) {
            return next(error)
        }

        const blogDto = new BlogDTO(newBlog)
        res.status(201).json({ blog: blogDto });

    },

    async getAll(req, res, next) {
        try {
            // yahan hume validation nahi karwani kiunke hum req ki body mein koi data send nahi kar rahe

            const blogs = await Blog.find({}) // returns all blogs

            const blogsDto = [];

            for (let i = 0; i < blogs.length; i++) {
                const dto = new BlogDTO(blogs[i]); // creating dto and pass it a memeber of blogsdto

                blogsDto.push(dto) // that dto will be pushed to blogs dto

            }

            return res.status(200).json({ blogs: blogsDto })
        } catch (error) {
            return next(error)
        }
    },
    async getById(req, res, next) {
        // 1. validate id
        // 2. response

        // 1. creating a schema of id
        const getByIdSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required(),
        })

        // validating
        const { error } = getByIdSchema.validate(req.params);

        if (error) {
            return next(error);

        }
        let blog;

        const { id } = req.params;// geting id from params
        try {

            blog = await Blog.findOne({ _id: id }).populate('author');

        }
        catch (error) {
            return next(error)
        }

        const blogDto = new BlogDetailsDTO(blog); // bringing blog in dto form

        return res.status(200).json({ blog: blogDto });

    },
    async update(req, res, next) {
        //1.  validate (req body)
        // if photo update delte old
        // if content or title update toh will not delete photo

        // 2. response

        // schema obj
        const updateBlogSchema = Joi.object({
            title: Joi.string().required(),
            content: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            blogId: Joi.string().regex(mongodbIdPattern).required(),
            photo: Joi.string()
        })

        // validating
        const { error } = updateBlogSchema.validate(req.body);

        const { title, content, blogId, photo } = req.body;

        // if updating photo -> delete previous one
        //  and  new one

        // finding blog through id
        let blog
        try {
            blog = await Blog.findOne({ _id: blogId });


        } catch (error) {
            return next(error)
        }

        // if req. body has photo null means we are not updating the photo
        if (photo) {
            previousPhoto = blog.photoPath;

            previousPhoto = previousPhoto.split('/').at(-1) // split at last
            // delete photo
            fs.unlinkSync(`storage/${ previousPhoto }`);

            // photo processing steps
            // a. read as buffer
            const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64')
            // b. allot a random name
            const imagePath = `${ Date.now() }-${ author }.png` // toh jo bhi img hogaa usko hum as png save karwaenge { this will be the naming convention}
            // c. save locally
            try {
                fs.writeFileSync(`storage/${ imagePath }`, buffer);
            } catch (error) {
                return next(error);
            }

            // update blog now

            // if i want to update photo :
            await Blog.updateOne({ _id: blogId },
                // now which fields to update are as follows:
                { title, content, photoPath: `${ BACKEND_SERVER_PATH }/storage/${ imagePath }` }
            );
        }
        // if we dont want to update photo , only title or content:
        else {
            await Blog.updateOne({ _id: blogId },
                // to update :
                { title, content }
            )
        }
        // on successful updation send msg and status
        return res.status(200).json({ message: 'blog updated!' });
    },
    async delete(req, res, next) {

        // validate id
        // delete blog
        // delete comments on this blog

        // create schema
        const deleteBlogSchema = Joi.object({
            id: Joi.string().regex(mongodbIdPattern).required()
        })

        // validating schema
        const { error } = deleteBlogSchema.validate(req.params);

        // extracting id from request
        const { id } = req.params;

        // a. delete blog
        // b. delete comments

        try {
            // a.
            await Blog.deleteOne({ _id: id });
            // b.
            await Comment.deleteMany({ blog: id });

        } catch (error) {
            return next(error)
        }
        return res.status(200).json({ message: 'blog deleted!' })
    },
}
module.exports = blogController;