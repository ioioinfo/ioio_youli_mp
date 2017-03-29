var _ = require('lodash');
var crypto = require('crypto');
var EventProxy = require('eventproxy');

var nav = function(server) {
	return {
		get_appkey: function() {
			var appkey = 'wxb00a7cdfa2b63fa1';
            return appkey;
		},
        
        get_appsecret: function() {
			var appsecret = '76235af4856413ca3c2c8ff700fdafac';
            return appsecret;
		},
		
		check_signature: function(signature,token,timestamp,nonce) {
			var shasum = crypto.createHash('sha1');
			
			arr = [token,timestamp,nonce].sort();
			
			shasum.update(arr.join(''));
			
			return shasum.digest('hex') === signature;
		},
	};
};

module.exports = nav;