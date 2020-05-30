// Create a context for holding contextual data
const startDatabase = require("./database")

const context = async req => {
    const db = await startDatabase();
    const {authorization: token} = req.headers;
    return {db, token}
}

module.exports = context;
