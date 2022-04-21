

module.exports = executeQuery;
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "weatherapp"
})

function executeQuery(sql, callback){

    //connection.connect();
    connection.query(sql,callback);
    //connection.end();
}
