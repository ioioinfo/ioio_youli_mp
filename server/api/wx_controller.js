var _ = require('lodash');
var crypto = require('crypto');
var moment = require('moment');
var eventproxy = require('eventproxy');
const util = require('util');
const uu_request = require('../utils/uu_request');
const wx_reply = require('../utils/wx_reply');

var module_prefix = 'wx_api';

exports.register = function(server, options, next) {
    var get_view = function(view) {
        return _.template('p/<%= view %>')({
            'view': view
        });
    };

    var host = "http://youli.hankang365.com/";
    var qq_host = "https://api.weixin.qq.com/";
    var appid = "wxb00a7cdfa2b63fa1";
    var appsecret = "76235af4856413ca3c2c8ff700fdafac";
    var cookie_options = {ttl:10*365*24*60*60*1000};
    
    var get_token = function(cb) {
        var access_token = server.plugins.cache.myCache.get("wx_access_token");
        if (access_token) {
            cb(access_token);
        } else {
            var url = "%scgi-bin/token?grant_type=client_credential&appid=%s&secret=%s";
            url = util.format(url,qq_host,appid,appsecret);
            
            uu_request.get(url, function(err, response, body) {
                console.log(body);
                var info = JSON.parse(body);
                access_token = info.access_token;
                server.plugins.cache.myCache.set("wx_access_token",access_token,7000);
                
                cb(access_token);
            });
        }
    };

    var page_get_access_token = function(request,cb) {
        var code = request.query.code;

        if (!code) {
            cb("");
        } else {
            var url = "%ssns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code";
            url = util.format(url,qq_host,appid,appsecret,code)

            uu_request.get(url, function(err, response, body) {
                console.log(body);
                var info = JSON.parse(body);
                openid = info.openid;
                
                cb(openid);
            });
        }
    };

    var page_get_openid = function(request,cb) {
        var state;
        var openid = "";

        if (request.state && request.state.cookie) {
            state = request.state.cookie;
            if (state.openid) {
                openid = state.openid;
            }
        }
        if (openid) {
            console.log("cookie openid:"+openid);
            cb(openid);
        }else {
            page_get_access_token(request, function(openid) {
                console.log("code openid:"+openid);
                cb(openid);
            });
        }
    };

    var jsapi_ticket = function(request,cb) {
        var p_url = request.connection.info.protocol + '://' + request.info.host + request.url.path;
        var key = "_jsapi_"+p_url;
        var ret = server.plugins.cache.myCache.get(key);

        if (ret) {
            cb(ret);
        } else {
            var url = '%scgi-bin/ticket/getticket?access_token=%s&type=jsapi'
            get_token(function(access_token) {
                url = util.format(url,qq_host,access_token);

                uu_request.get(url, function(err, response, body) {
                    console.log(body);
                    var info = JSON.parse(body);

                    var jsapi_ticket = info["ticket"];

                    //传输参数
                    var arr = {'noncestr':'uuinfo','jsapi_ticket':jsapi_ticket,'timestamp':'1414587457','url':p_url}
                    var sort_arr1 = [];

                    _.forIn(arr,function(value,key) {
                        sort_arr1 = _.concat(sort_arr1,{key:key,value:value});
                    });
                    var sort_arr2 = _.sortBy(sort_arr1, ['key']);
                    var s = [];
                    _(sort_arr2).forEach(function(m) {
                        s = _.concat(s,m.key+"="+m.value);
                    });
                    var s2 = _.join(s,'&');

                    var shasum = crypto.createHash('sha1');
                    var signature = shasum.update(s2).digest('hex');

                    ret = {'appid':appid,'noncestr':'uuinfo','jsapi_ticket':jsapi_ticket,'timestamp':1414587457,'url':p_url,'signature':signature,'str':s2};

                    server.plugins.cache.myCache.set(key,ret,7000);
                    cb(ret);
                });
            });
        }
    };

    var get_user_info = function(openid,cb) {
        if (!openid) {
            return cb("");
        }
        var url = "%scgi-bin/user/info?access_token=%s&openid=%s";

        get_token(function(access_token) {
            url = util.format(url,qq_host,access_token,openid);

            uu_request.get(url, function(err, response, body) {
                return cb(body);
            });
        });
    };

    var get_go2auth_url = function(path,cb) {
        var url = host + path;
        var query_string = "?appid=%s&redirect_uri=%s&response_type=code&scope=snsapi_base&state=base#wechat_redirect";
        var r_url = "https://open.weixin.qq.com/connect/oauth2/authorize" + query_string;
        r_url = util.format(r_url,appid,url);

        cb(r_url);
    };

    server.route([
        {
            method: 'GET',
            path: '/',
            handler: function(request, reply) {
                return reply({"success":true,"message":"ok","desc":"ioio fanli"});
            },
        },
        
        {
            method: 'GET',
            path: '/wechat',
            handler: function(request, reply) {
                var echostr = request.query.echostr;
                var signature = request.query.signature;
                var timestamp = request.query.timestamp;
                var nonce = request.query.nonce;
                var token = "uuinfo_weixin";
                
                var check = server.plugins.models.setting.check_signature(signature,token,timestamp,nonce);
                
                if (check) {
                    return reply(echostr);
                } else {
                    return reply("入口错误");
                }
            },
        },
        
        {
            method: 'POST',
            path: '/wechat',
            handler: function(request, reply) {
                var body = request.payload;
                var domain = "youli";
                
                console.log(body);
                
                wx_reply.process_xml(body, function(xml,msg_type,openid,resp) {
                    if (msg_type == "text") {
                        var content = xml.Content[0];
                        //save content
                        server.plugins.models.person.save_wx_text(function(err,result) {
                            return reply(resp.text({content:"你好"}));
                        }, domain, openid, content);
                    } else if (msg_type == "event") {
                        var event = xml.Event[0];
                        
                        if (event == "subscribe") {
                            get_user_info(openid, function(ret_body) {
                                var info = JSON.parse(ret_body);
                                console.log(ret_body);

                                var nickname = info["nickname"];
                                var sex = info["sex"];
                                var headimgurl = info["headimgurl"];
                                var unionid = info["unionid"];

                                server.plugins.services.youli.bind_user(openid,nickname,sex,headimgurl,unionid, function(err,result) {
                                    console.log(result);
                                    return reply(resp.text({content:"终于等到你"}));
                                });
                            });
                        } else if (event == "unsubscribe") {
                            server.plugins.services.youli.unbind_user(openid, function(err,result) {
                                return reply("");
                            });
                        }
                    }
                });
            },
        },
        
        {
            method: 'GET',
            path: '/get_token',
            handler: function(request, reply) {
                get_token(function(access_token) {
                    reply(access_token);
                });
            },
        },
        
        {
            method: 'GET',
            path: '/create_menu',
            handler: function(request, reply) {
                var url = "%scgi-bin/menu/create?access_token=%s";
                
                var menu = {
                    "button": [
                        {
                            "type": "view",
                            "name": "发现项目",
                            "url": host + "go2auth/projects"
                        },
                        {
                            "type": "view",
                            "name": "我的",
                            "url": host + "go2auth/user_account"
                        }
                    ]
                };
                
                get_token(function(access_token) {
                    url = util.format(url,qq_host,access_token);
                    
                    uu_request.json(url, menu, function(err, body) {
                        if (err) {
                            return reply(err);
                        }
                        return reply(body);
                    });
                });
            },
        },

        {
            method: 'GET',
            path: '/location',
            handler: function(request, reply) {
                jsapi_ticket(request, function(info) {
                    return reply.view(get_view("location.html"), {info:info});
                });
            }
        },

        {
            method: 'GET',
            path: '/projects',
            handler: function(request, reply) {
                var state;
                var number = [1,2,3,4];

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_projects(openid, function(err,projects) {
                        if (err) {
                            return reply.view(get_view("error.html"), projects);
                        }
                        jsapi_ticket(request, function(info) {
                            var params = {openid:openid,projects:projects,number:number,info:info};
                            return reply.view(get_view("projects.html"), params).state('cookie', state, cookie_options);
                        });
                    });
                });
            }
        },

        {
            method: 'GET',
            path: '/go2auth/project',
            handler: function(request, reply) {
                var project_id = request.query.project_id;
                var share_id = request.query.share_id;

                var path = "project/" + project_id + "?share_id=" + share_id;

                get_go2auth_url(path,function(r_url) {
                    return reply.redirect(r_url);
                });
            }
        },

        {
            method: 'GET',
            path: '/go2auth/{key}',
            handler: function(request, reply) {
                get_go2auth_url(request.params.key,function(r_url) {
                    return reply.redirect(r_url);
                });
            }
        },

        {
            method: 'GET',
            path: '/project/{project_id}',
            handler: function(request, reply) {
                var number = [1,2];
                var project_id = request.params.project_id;
                var share_id = request.query.share_id;

                page_get_openid(request, function(openid) {
                    server.plugins.services.youli.get_project(openid, project_id, function(err,project) {
                        if (err) {
                            return reply.view(get_view("error.html"), project);
                        }
                        jsapi_ticket(request, function(info) {
                            var params = {openid:openid,share_id:share_id,project:project,number:number,info:info};
                            return reply.view(get_view("project_view.html"), params);
                        });
                    });
                });
            }
        },

        {
            method: 'POST',
            path: '/visit_project',
            handler: function(request, reply) {
                var openid = request.payload.openid;
                var project_id = request.payload.project_id;
                var share_id = request.payload.share_id;

                server.plugins.services.youli.visit_project(openid, project_id, share_id, function(err,result) {
                    return reply({success:true,message:"ok"});
                });
            }
        },

        {
            method: 'GET',
            path: '/user_account',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        //查询用户余额
                        server.plugins.services.youli.find_user_balance(user.id,function(err,row) {
                            user.balance_amount = row.balance_amount;
                            
                            jsapi_ticket(request, function(info) {
                                var params = {openid:openid,user:user,info:info};
                                return reply.view(get_view("user_account.html"), params).state('cookie', state, cookie_options);
                            });
                        });
                    });
                });
            }
        },

        //用户信息
        {
            method: 'GET',
            path: '/user_info',
            handler: function(request, reply) {
                page_get_openid(request, function(openid) {
                    if (!openid) {
                        return reply("请在微信中访问");
                    }
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        jsapi_ticket(request, function(info) {
                            var params = {openid:openid,user:user,info:info};
                            var hb = request.query.hb;
                            if (hb) {
                                params.hb = hb;
                            }
                            return reply.view(get_view("user_info.html"), params);
                        });
                    });
                });
            }
        },
        
        //获取用户收藏信息
        {
            method: 'GET',
            path: '/get_favorite',
            handler: function(request, reply) {
                var project_id = request.query.project_id;
                if (!project_id) {
                    return reply({"success":false,"message":"param project_id is null"});
                }
                
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        //查询账号历史
                        server.plugins.services.youli.get_favorite_by_person_and_project(user.id,project_id,function(err,row) {
                            return reply({"success":true,"message":"ok","row":row});
                        });
                    });
                });
            }
        },
        
        //保存收藏信息
        {
            method: 'POST',
            path: '/save_favorite',
            handler: function(request, reply) {
                var is_active = request.payload.is_active;
                if (!is_active) {
                    return reply({"success":false,"message":"param is_active is null"});
                }
                
                var project_id = request.payload.project_id;
                if (!project_id) {
                    return reply({"success":false,"message":"param project_id is null"});
                }
                
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        //保存收藏信息
                        server.plugins.services.youli.save_favorite(user.id,is_active,project_id,function(err,result) {
                            if (err) {
                                return reply({"success":false,"message":result.message});
                            }
                            return reply({"success":true,"message":"ok"});
                        });
                    });
                });
            }
        },
        
        {
            method: 'GET',
            path: '/list_favorite',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        //查询收藏列表
                        server.plugins.services.youli.list_favorite(user.id,function(err,row) {
                            return reply({"success":true,"message":"ok","rows":rows});
                        });
                    });
                });
            }
        },

        {
            method: 'GET',
            path: '/cash_record',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        var ep = eventproxy.create("rows","balance",function(rows,balance) {
                            user.balance_amount = balance.balance_amount;
                            
                            jsapi_ticket(request, function(info) {
                                var params = {openid:openid,user:user,info:info,rows:rows};
                                return reply.view(get_view("cash_record.html"), params).state('cookie', state, cookie_options);
                            });
                        });
                        //查询用户余额
                        server.plugins.services.youli.find_user_balance(user.id,function(err,row) {
                            ep.emit("balance",row);
                        });
                        //查询账号历史
                        server.plugins.services.youli.list_user_account(user.id,function(err,rows) {
                            ep.emit("rows",rows);
                        });
                    });
                });
            }
        },

        //我的提现账户
        {
            method: 'GET',
            path: '/withdraw_accounts',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        if (err) {
                            return reply("用户错误");
                        }
                        //判断用户是否实名绑定
                        if (!user.mobile || !user.name) {
                            return reply.view(get_view("error_redirect.html"), {user:user,"message":"先绑定姓名手机号才能添加提现帐号","url":"go2auth/user_info"});
                        }
                        server.plugins.services.youli.list_withdraw_account(user.id, function(err,rows) {
                            jsapi_ticket(request, function(info) {
                                var params = {openid:openid,user:user,info:info,rows:rows};
                                return reply.view(get_view("withdraw_accounts.html"), params).state('cookie', state, cookie_options);
                            });
                        });
                    });
                });
            }
        },

        //添加银行帐号页面
        {
            method: 'GET',
            path: '/add_bank_account',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        jsapi_ticket(request, function(info) {
                            var params = {openid:openid,user:user,info:info};
                            return reply.view(get_view("add_bank_account.html"), params).state('cookie', state, cookie_options);
                        });
                    });
                });
            }
        },
        
        //保存银行帐号
        {
            method: 'POST',
            path: '/add_bank_account',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        //保存银行账号信息
                        var account_truename = request.payload.truename;
                        var bankname = request.payload.bankname;
                        var card_number = request.payload.card_number;
                        
                        if (!account_truename || !bankname || !card_number) {
                            return reply({"success":false,"message":"param null"});
                        }
                        
                        var wx_user_id = user.id;
                        var account_type_code = "bank";
                        var card_type = bankname;
                        
                        server.plugins.services.youli.add_withdraw_account(wx_user_id,account_type_code,account_truename
                            ,null,card_type,card_number, function(err,content) {
                            return reply({"success":true,"message":"ok"});
                        });
                    });
                });
            }
        },
        
        //添加支付宝帐号页面
        {
            method: 'GET',
            path: '/add_alipay_account',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        jsapi_ticket(request, function(info) {
                            var params = {openid:openid,user:user,info:info};
                            return reply.view(get_view("add_alipay_account.html"), params).state('cookie', state, cookie_options);
                        });
                    });
                });
            }
        },
        
        //保存支付宝帐号
        {
            method: 'POST',
            path: '/add_alipay_account',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        //保存支付宝账号信息
                        var account_truename = request.payload.truename;
                        var account_username = request.payload.username;
                        
                        if (!account_truename || !account_username) {
                            return reply({"success":false,"message":"param null"});
                        }
                        
                        var wx_user_id = user.id;
                        var account_type_code = "alipay";
                        var card_type = "alipay";
                        
                        server.plugins.services.youli.add_withdraw_account(wx_user_id,account_type_code,account_truename
                            ,account_username,card_type,null, function(err,content) {
                            return reply({"success":true,"message":"ok"});
                        });
                    });
                });
            }
        },

        {
            method: 'POST',
            path: '/update_user_info',
            handler: function(request, reply) {
                var name = request.payload.name;
                var idcardno = request.payload.idcardno;
                var mobile = request.payload.mobile;

                page_get_openid(request, function(openid) {
                    if (!openid) {
                        return reply({success:false,message:"请在微信中访问"});
                    }
                    server.plugins.services.youli.update_user_info(openid, name, idcardno, mobile, function(err,projects) {
                        return reply({success:true,message:"ok"});
                    });
                });
            }
        },

        //项目预约
        {
            method: 'POST',
            path: '/subscribe_project',
            handler: function(request, reply) {
                var openid = request.payload.openid;
                var project_id = request.payload.project_id;

                server.plugins.services.youli.get_user(openid, function(err,user) {
                    if (!user.mobile || !user.name) {
                        //需要注册
                        return reply({success:false,code:-1,message:"请先在个人中心填写联系信息再预约。"});
                    }
                    
                    server.plugins.services.youli.subscribe_project(openid, project_id, function(err,result) {
                        if (err) {
                            return reply({success:false,code:1,message:"预约失败"});
                        }
                        if (!result.success) {
                            return reply({success:false,code:1,message:result.message});
                        }
                        return reply({success:true,code:0,message:"ok"});
                    });
                });
            }
        },
        
        //绑定用户并预约
        {
            method: 'POST',
            path: '/update_user_info_and_subscribe',
            handler: function(request, reply) {
                var openid = request.payload.openid;
                var project_id = request.payload.project_id;
                var name = request.payload.name;
                var mobile = request.payload.mobile;
                var idcardno = request.payload.idcardno;

                server.plugins.services.youli.get_user(openid, function(err,user) {
                    if (!user.mobile || !user.name) {
                        //需要注册
                        server.plugins.services.youli.update_user_info(openid, name, idcardno, mobile, function(err,content) {
                            if (err) {
                                return reply({success:false,message:"更新客户信息失败"});
                            }
                            server.plugins.services.youli.subscribe_project(openid, project_id, function(err,result) {
                                if (err) {
                                    return reply({success:false,code:1,message:"预约失败"});
                                }
                                if (!result.success) {
                                    return reply({success:false,code:1,message:result.message});
                                }
                                return reply({success:true,code:0,message:"ok"});
                            });
                        });
                    }
                });
            },
        },

        {
            method: 'GET',
            path: '/my_subscribes',
            handler: function(request, reply) {
                var state;
                var cur = request.query.cur;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_my_subscribes(openid, function(err,projects) {
                        if (err) {
                            return reply.view(get_view("error.html"), projects);
                        }
                        jsapi_ticket(request, function(info) {
                            var params = {openid:openid,projects:projects,info:info,cur:cur};
                            return reply.view(get_view("my_subscribes.html"), params).state('cookie', state, cookie_options);
                        });
                    });
                });
            }
        },

        {
            method: 'GET',
            path: '/get_my_finished_subscribes',
            handler: function(request, reply) {
                page_get_openid(request, function(openid) {
                    server.plugins.services.youli.get_my_finished_subscribes(openid, function(err,projects) {
                        if (err) {
                            return reply({success:false,message:"数据错误"});
                        }
                        return reply({success:true,projects:projects});
                    });
                });
            }
        },

        {
            method: 'GET',
            path: '/get_my_unfinished_subscribes',
            handler: function(request, reply) {
                page_get_openid(request, function(openid) {
                    server.plugins.services.youli.get_my_unfinished_subscribes(openid, function(err,projects) {
                        if (err) {
                            return reply({success:false,message:"数据错误"});
                        }
                        return reply({success:true,projects:projects});
                    });
                });
            }
        },

        {
            method: 'POST',
            path: '/order_shenqingfanxian',
            handler: function(request, reply) {
                var project_subscribe_id = request.payload.project_subscribe_id;

                page_get_openid(request, function(openid) {
                    server.plugins.services.youli.order_shenqingfanxian(openid, project_subscribe_id, function(err,projects) {
                        return reply({success:true,message:"ok"});
                    });
                });
            }
        },

        {
            method: 'POST',
            path: '/order_yonghu_confirm',
            handler: function(request, reply) {
                var project_subscribe_id = request.payload.project_subscribe_id;

                page_get_openid(request, function(openid) {
                    server.plugins.services.youli.order_yonghu_confirm(openid, project_subscribe_id, function(err,projects) {
                        return reply({success:true,message:"ok"});
                    });
                });
            }
        },

        {
            method: 'POST',
            path: '/order_yonghu_shensu',
            handler: function(request, reply) {
                var project_subscribe_id = request.payload.project_subscribe_id;
                var server_id = request.payload.server_id;
                var shensu_reason = request.payload.shensu_reason;

                page_get_openid(request, function(openid) {
                    if (!openid) {
                        return reply({success:false,message:"请在微信中访问"});
                    }
                    //保存图片
                    var url = "http://127.0.0.1:6899/save_media";
                    var data = {platform_id:'youli',media_id:server_id,'path':'C:/uuinfo/node/scm_node/static/images/youli/media'};
                    
                    uu_request.do_post_method(url, data, function(err, content) {
                        var file_name = content.file_name;
                        server.plugins.services.youli.order_yonghu_shensu(openid, project_subscribe_id, server_id
                            , file_name, shensu_reason, function(err,projects) {
                            return reply({success:true,message:"ok"});
                        });
                    });
                });
            }
        },

        {
            method: 'POST',
            path: '/recommend_project',
            handler: function(request, reply) {
                var openid = request.payload.openid;
                var project_id = request.payload.project_id;

                server.plugins.services.youli.recommend_project(openid, project_id, function(err,projects) {
                    return reply({success:true,message:"ok"});
                });
            }
        },

        {
            method: 'GET',
            path: '/my_recommends',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    state = {openid:openid};
                    server.plugins.services.youli.get_my_recommends(openid, function(err,projects) {
                        if (err) {
                            return reply.view(get_view("error.html"), projects);
                        }
                        jsapi_ticket(request, function(info) {
                            var params = {openid:openid,projects:projects,info:info};
                            return reply.view(get_view("my_recommends.html"), params).state('cookie', state, cookie_options);
                        });
                    });
                });
            }
        },

        {
            method: 'GET',
            path: '/my_messages',
            handler: function(request, reply) {
                var state;

                jsapi_ticket(request, function(info) {
                    var params = {info:info};
                    return reply.view(get_view("my_messages.html"), params);
                });
            }
        },
        
        {
            method: 'GET',
            path: '/get_my_messages',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    server.plugins.services.youli.get_my_messages(openid, function(err,rows) {
                        if (err) {
                            return reply({success:false,message:"error"});
                        }
                        return reply({success:true,rows:rows});
                    });
                });
            }
        },

        {
            method: 'GET',
            path: '/my_favourites',
            handler: function(request, reply) {
                var state;

                page_get_openid(request, function(openid) {
                    server.plugins.services.youli.get_user(openid, function(err,user) {
                        if (err) {
                            return reply.view(get_view("error.html"));
                        }
                        
                        server.plugins.services.youli.list_favorites(user.id, function(err,rows) {
                            if (err) {
                                return reply.view(get_view("error.html"), rows);
                            }
                            if (!rows || rows.length == 0) {
                                return reply.view(get_view("my_favourites_none.html"));
                            }
                            jsapi_ticket(request, function(info) {
                                var params = {openid:openid,rows:rows,info:info};
                                return reply.view(get_view("my_favourites.html"), params);
                            });
                        });
                    });
                });
            }
        },

        {
            method: 'GET',
            path: '/amap_geocode',
            handler: function(request, reply) {
                var address = request.query.address;

                server.plugins.services.amap.geocode(address, function(err,rows) {
                    if (err) {
                        return reply("数据错误");
                    }
                    return reply(rows);
                });
            }
        },

        {
            method: 'GET',
            path: '/yihai_account',
            handler: function(request, reply) {
                return reply.view(get_view("yihai_account.html"));
            }
        },
        
    ]);

    next();
}

exports.register.attributes = {
    name: module_prefix
};