/** Database setup for BizTime. */

require('dotenv').config({ path: "./.env" })
const { Client } = require('pg');

// function getDatabaseURI() {
//     return (process.env.NODE_ENV === "test")
//         ? 
// }

let DB_URI = (process.env.NODE_ENV === 'test')
    ? `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@127.0.0.1:5432/biztime_test`
    : `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@127.0.0.1:5432/biztime`;


let db = new Client({
    connectionString: DB_URI
});

db.connect();

module.exports = db