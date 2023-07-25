const express = require('express');
// CONTROLLERS
const authController = require('../controller/authController');
const blogController = require('../controller/blogController')
const commentController = require('../controller/commentController')

// MIDDLEWARES
const auth = require("../middlewares/auth")

// creating a router 
const router = express.Router();

// TESITNG
router.get('/test', (req, res) => {
    res.json({ msg: 'router working' })
})

// what routes do we want :
// -----------------------------USER

// REGISTER
router.post('/register', authController.register);

// LOGIN
router.post('/login', authController.login);

// LOGOUT
router.post('/logout', auth, authController.logout);

// REFRESH
router.get('/refresh', authController.refresh);

// -----------------------------BLOG
// --------------- CRUD
// CREATE
router.post('/blog', auth, blogController.create);

// READ ALL BLOGS
router.get('/blog/all', auth, blogController.getAll);

// READ BLOG BY ID
router.get('/blog/:id', auth, blogController.getById);

// UPDATE
router.put('/blog', auth, blogController.update)

// DELETE
router.delete('/blog/:id', auth, blogController.delete);

// -----------------------------COMMENT
//  ---------------CRUD
// CREATE
router.post('/comment', auth, commentController.create)

// READ     COMMENTS BY BLOG ID
router.get('/comment/:id', auth, commentController.getById)


module.exports = router;