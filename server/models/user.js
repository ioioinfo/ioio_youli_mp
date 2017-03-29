var _ = require('lodash');
var crypto = require('crypto');
var EventProxy = require('eventproxy');

var nav = function(server) {
	return {
		save_subscribe: function(cb,domain,openid) {
			var sql = `insert ignore into person_wx_subscribe(id,domain,openid,event,created_at)
			values (uuid(),?,?,'关注',now())`;

			var args = [domain,openid];
			server.plugins.mysql.query(sql,args,function(err, result) {
				cb({'success':"ok"});
			});
		},

		save_wx_text: function(cb,domain,openid,content) {
			var sql = `insert into person_wx_texts(id,domain,openid,content,created_at)
			values(uuid(),?,?,?,now())`;

			var args = [domain,openid,content];
			server.plugins.mysql.query(sql,args,function(err, result) {
				cb({'success':"ok"});
			});
		},
	};
};

module.exports = nav;