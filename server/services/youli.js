var _ = require('lodash');
var eventproxy = require('eventproxy');
const util = require('util');
const uu_request = require('../utils/uu_request');

//var host = "http://ec2-54-223-99-241.cn-north-1.compute.amazonaws.com.cn:3000/wxapi/";
var host = "http://211.149.248.241:17002/wxapi/";

var nav = function(server) {
    return {
        get_user: function(openid,cb) {
            var url = host + "user_info";
            var data = {openid:openid};

            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    var user = {};

                    if (body["success"]) {
                        user = body["user"];
                        cb(false,user);
                    } else {
                        cb(true,user);
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        //查询账户余额
        find_user_balance: function(wx_user_id,cb) {
            var url = host + "find_user_balance?wx_user_id=" + wx_user_id;
            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);

                    var row = {};
                    if (info["success"]) {
                        row = info["row"];
                    }
                    cb(err,row);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        //查询等待提现金额
        find_user_withdraw_amount: function(wx_user_id,cb) {
            var url = host + "find_user_withdraw_amount?wx_user_id=" + wx_user_id;
            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
            
                    var row = {};
                    if (info["success"]) {
                        row = info["row"];
                    }
                    cb(err,row);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        //查询账户可用余额
        find_user_available: function(wx_user_id,cb) {
            var url = host + "find_user_available?wx_user_id=" + wx_user_id;
            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);

                    var row = {};
                    if (info["success"]) {
                        row = info["row"];
                    }
                    cb(err,row);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        //保存提现申请
        save_withdraw(wx_user_id,account_id,amount,cb) {
            var url = host + "save_withdraw";
            var data = {wx_user_id:wx_user_id,account_id:account_id,amount:amount};
            uu_request.request(url, data, function(err, response, body) {
                cb(err,body);
            });
        },
        
        list_user_account: function(wx_user_id,cb) {
            var url = host + "list_user_account?wx_user_id=" + wx_user_id;
            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);

                    var rows = [];
                    if (info["success"]) {
                        rows = info["rows"];
                    }
                    cb(err,rows);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        bind_user: function(openid,nickname,sex,headimgurl,unionid,cb) {
            var url = host + "bind_user";
            var data = {openid:openid,nickname:nickname,sex:sex,headimgurl:headimgurl,unionid:unionid};
            uu_request.request(url, data, function(err, response, body) {
                cb(err,body);
            });
        },

        unbind_user: function(openid, cb) {
            cb(false,"取消关注");
        },

        update_user_info: function(openid,name,idcardno,mobile,cb) {
            var url = host + "update_user_info";
            var data = {openid:openid,name:name,idcardno:idcardno,mobile:mobile};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        //查询收藏信息
        get_favorite_by_person_and_project: function(wx_user_id,project_id,cb) {
            var url = host + "get_favorite_by_person_and_project?wx_user_id=" + wx_user_id + "&project_id=" + project_id;
            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    var row = {};

                    if (info["success"]) {
                        row = info["row"];
                    }
                    cb(err,row);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        save_favorite: function(wx_user_id,is_active,project_id,cb) {
            var url = host + "save_favorite";
            var data = {wx_user_id:wx_user_id,is_active:is_active,project_id:project_id};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        list_favorites: function(wx_user_id,cb) {
            var url = host + "list_favorites?wx_user_id=" + wx_user_id;
            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    var rows = {};

                    if (info["success"]) {
                        rows = info["rows"];
                    }
                    cb(err,rows);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        get_projects: function(openid,cb) {
            var url = host + "projects?openid=" + openid;
            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    var projects = [];

                    if (info["success"]) {
                        projects = info["projects"];
                    }
                    cb(err,projects);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        //根据id数组查询项目信息
        list_project_by_ids: function(ids,cb) {
            var url = host + "list_project_by_ids?ids=" + JSON.stringify(ids);
            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    var rows = [];
            
                    if (info["success"]) {
                        rows = info["rows"];
                    }
                    cb(err,rows);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        get_project: function(openid,project_id,cb) {
            var url = host + "project/%s?openid=%s";
            url = util.format(url,project_id,openid);

            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    if (info["success"]) {
                        project = info["project"];
                        cb(false,project);
                    } else {
                        cb(true,{message:"项目没找到"});
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        visit_project: function(openid,project_id,share_id,cb) {
            var url = host + "project/visit";
            var data = {openid:openid,project_id:project_id,recommender_openid:share_id};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        subscribe_project: function(openid,project_id,cb) {
            var url = host + "project/subscribe";
            var data = {openid:openid,project_id:project_id};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        get_my_subscribes: function(openid,cb) {
            var url = host + "my_subscribes?openid=%s";
            url = util.format(url,openid);

            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    if (info["success"]) {
                        projects = info["subscribes"];
                        cb(false,projects);
                    } else {
                        cb(true,{message:"项目没找到"});
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        get_my_finished_subscribes: function(openid,cb) {
            var url = host + "my_finished_subscribes?openid=%s";
            url = util.format(url,openid);

            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    if (info["success"]) {
                        projects = info["subscribes"];
                        cb(false,projects);
                    } else {
                        cb(true,{message:"项目没找到"});
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        get_my_unfinished_subscribes: function(openid,cb) {
            var url = host + "my_unfinished_subscribes?openid=%s";
            url = util.format(url,openid);

            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    if (info["success"]) {
                        projects = info["subscribes"];
                        cb(false,projects);
                    } else {
                        cb(true,{message:"项目没找到"});
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        order_shenqingfanxian: function(openid,project_subscribe_id,cb) {
            var url = host + "order/shenqingfanxian";
            var data = {openid:openid,project_subscribe_id:project_subscribe_id};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        order_yonghu_confirm: function(openid,project_subscribe_id,cb) {
            var url = host + "order/yonghu_confirm";
            var data = {openid:openid,project_subscribe_id:project_subscribe_id};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        order_yonghu_shensu: function(openid,project_subscribe_id,server_ids,file_names,shensu_reason,cb) {
            var url = host + "order/shensu";
            var data = {openid:openid,project_subscribe_id:project_subscribe_id,server_ids:server_ids,file_names:file_names
                ,shensu_reason:shensu_reason};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        recommend_project: function(openid,project_id,cb) {
            var url = host + "project/recommend";
            var data = {openid:openid,project_id:project_id};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        get_my_recommends: function(wx_user_id,cb) {
            var url = host + "my_recommends?wx_user_id=%s";
            url = util.format(url,wx_user_id);

            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    if (info["success"]) {
                        projects = info["projects"];
                        cb(false,projects);
                    } else {
                        cb(true,{message:"项目没找到"});
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },

        get_my_messages: function(openid,cb) {
            var url = host + "messages?openid=%s";
            url = util.format(url,openid);

            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    if (info["success"]) {
                        var rows = info["messages"];
                        cb(false,rows);
                    } else {
                        cb(true,{message:"项目没找到"});
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        //获取消息数量
        get_my_message_count: function(openid,cb) {
            var url = host + "message_count?openid=%s";
            url = util.format(url,openid);

            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    if (info["success"]) {
                        var row = info["row"];
                        cb(false,row);
                    } else {
                        cb(true,{"row_number":0});
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        //消息标记为已读
        my_message_read: function(id,cb) {
            var url = host + "my_message_read";
            var data = {id:id};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        //提现帐号
        get_withdraw_account: function(wx_user_id,cb) {
            var url = host + "get_withdraw_account?wx_user_id=%s";
            url = util.format(url,wx_user_id);

            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    if (info["success"]) {
                        var row = info["row"];
                        cb(false,row);
                    } else {
                        cb(true,{message:"项目没找到"});
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        list_withdraw_account: function(wx_user_id,cb) {
            var url = host + "list_withdraw_account?wx_user_id=%s";
            url = util.format(url,wx_user_id);

            uu_request.get(url, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    var info = JSON.parse(body);
                    if (info["success"]) {
                        var rows = info["rows"];
                        cb(false,rows);
                    } else {
                        cb(true,{message:"项目没找到"});
                    }
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        add_withdraw_account: function(wx_user_id,account_type_code,account_truename,account_username,card_type,card_number,cb) {
            var url = host + "add_withdraw_account";
            var data = {wx_user_id:wx_user_id,account_type_code:account_type_code,account_truename:account_truename
                ,account_username:account_username,card_type:card_type,card_number:card_number};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        update_withdraw_account: function(id,wx_user_id,account_type_code,account_truename,account_username,card_type,card_number,cb) {
            var url = host + "update_withdraw_account";
            var data = {wx_user_id:wx_user_id,account_type_code:account_type_code,account_truename:account_truename
                ,account_username:account_username,card_type:card_type,card_number:card_number,id:id};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
        
        delete_withdraw_account: function(wx_user_id,id,cb) {
            var url = host + "delete_withdraw_account";
            var data = {wx_user_id:wx_user_id,id:id};
            uu_request.request(url, data, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log(body);
                    cb(err,body);
                } else {
                    cb(true,{message:"网络错误"});
                }
            });
        },
    };
};

module.exports = nav;