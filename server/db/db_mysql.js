var mysql = require('mysql');

// Base routes for default index/root path, about page, 404 error pages, and others..
exports.register = function(server, options, next){

	var pool  = mysql.createPool(options);

	server.expose('pool', pool);
  
	var query = function(sql,values,callback) {
		var cb = callback;
		if (typeof values === 'function') {
			cb = values;
		}
		pool.getConnection(function(err, connection) {
			var handler = function(err, rows) {
				connection.release();
				cb(err, rows);
			};
			if (typeof values === 'function') {
				connection.query(sql, handler);
			} else {
				connection.query(sql, values, handler);
			}
		});
	};
	server.expose('query', query);
  
	var count = function(query,values,callback) {
		var cb = callback;
		if (typeof values === 'function') {
			cb = values;
		}
		pool.getConnection(function(err, connection) {
			var count_query = "select count(*) cnt from ("+query+") t";
			var handler = function(err, rows) {
				connection.release();
				if (rows && rows.length>0) {
					cb(err, rows[0].cnt);
				} else {
					cb(err, 0);
				}
			};
			if (typeof values === 'function') {
				connection.query(count_query, handler);
			} else {
				connection.query(count_query, values, handler);
			}
		});
	};
  
	server.expose('count', count);
  
	next();
}

exports.register.attributes = {
    name: 'mysql'
};