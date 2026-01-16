class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null;
        this.message = message
        this.success = false
        this.errors = errors

        // this if else is only for the roduction

        if (stack) {
            this.stack = stack;
        } else if (process.env.NODE_ENV === 'development') {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError }