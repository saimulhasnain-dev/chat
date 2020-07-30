const mysql = require('mysql');
const pool  = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat'
});

const query = (options, first = false) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(function(err, connection) {
            if (err) return reject(err); // not connected!
          
            connection.query(options, function (error, results, _) {
                // When done with the connection, release it.
                connection.release();
                
                if (error) return reject(err); 

                results = first ? results[0] : results;
                resolve(results);
            });
          });
    });
}

module.exports = { query };
