const express = require('express')
const dbConnect = require('./database/index')
const { PORT } = require('./config/index')
const router = require('./routes/index')
const errorHandler = require('./middlewares/errorHandler')
const cookieParser = require('cookie-parser');

const app = express()

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ M I D D L E W A R E S @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// when app is made of express then 
app.use(cookieParser())

// our app can communicate and accept data through json
app.use(express.json())

// to use router file we have to add middleware
app.use(router);

// connect to mongodb file
dbConnect();

// middlewares are run sequentially so take note of that when coding
// ke response se pehle tak hume error handling karleni hai

// takee is middleware through hum photos access kar saken online
app.use('/storage', express.static('storage'));

app.use(errorHandler);


app.listen(PORT, () => {
    console.log('-----------------------------------------------------------------------------')
    console.log(`A P P   L I S T E N I N G   O N   P O R T : ${ PORT }`)
})

// nodemon: npm run dev
// 4:00;37