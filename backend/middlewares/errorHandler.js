const { ValidationError } = require('joi');

// middleware function()
const errorHandler = (error, req, res, next) => {

    // default error
    let status = 500;
    let data = {
        message: 'Internal Server Error'
    }

    // if error is a Validation Error from joi
    if (error instanceof ValidationError) {
        // status = error.status;
        status = 401;
        data.message = error.message;

        return res.status(status).json(data);
    }

    // if error is other than validation and it has status property so set status
    if (error.status) {
        status = error.status;
    }

    // if error is other than validation and it has msg property so set msg
    if (error.message) {
        data.message = error.message;
    }


    // if error is of the kind that its neither a validation error 
    // from jou nor has status code nor has a message then the default
    //  error object parameters define will be returned:
    return res.status(status).json(data);
}

module.exports = errorHandler;