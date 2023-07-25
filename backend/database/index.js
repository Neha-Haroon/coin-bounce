const mongoose = require('mongoose');

// for importing enviroment variables
// destructuring as .env returns an object of values will we require a value only
const { MONGODB_CONNECTION_STRING } = require('../config/index')
// the database we want to establish connection with at mongodb atlas



// function to establish connection
const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_CONNECTION_STRING);
        console.log('-----------------------------------------------------------------------------')
        console.log(`Database is connected to host : ${ conn.connection.host }`);
        console.log('-----------------------------------------------------------------------------')
    } catch (error) {
        console.log(`Error:${ error }`);
    }
}


module.exports = dbConnect;