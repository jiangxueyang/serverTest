const Tips = require('./tip');
const IS = require('is');
const php_date = require('locutus/php/datetime/date');
const strtotime = require('locutus/php/datetime/strtotime');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

let util = {
    //formatData 必须为 {key,type}的格式,可以不传type
    formatData(params, valids) {
        let res = true;
        if (!IS.object(params)) return false;
        if (!IS.array(valids)) return false;
        for (let i = 0; i < valids.length; i++) {
            let e = valids[i];
            let {key, type} = e;
            if (!key) {
                res = false;
                break;
            }
            let value = params[key] || '';
            if (type === 'not_empty') {
                if (IS.empty(value)) {
                    res = false;
                    break;
                }
            } else if (type === 'number') {
                value = Number(value);
                if (!IS.number(value) || IS.nan(value)) {
                    res = false;
                    break;
                }
            } else if(type === 'reg'){
                let reg = e['reg'];
                if(!reg || !reg.test(value)){
                    res = false;
                    break;
                }
            }else {
                if (!IS[type](value)) {
                    res = false;
                    break;
                }
            }
        }
        return res;


    },
    filter(params, filterArr) {
        if (IS.object(params) && IS.array(filterArr)) {
            let data = {};
            filterArr.forEach(e => {
                let val = params[e];
                if (!IS.undefined(val) && !IS.null(val) && !IS.empty(val) || IS.array.empty(val)) {
                    data[e] = val;
                }
            });
            return data;
        } else {
            return params;
        }
    },
    queryData(params, queryArr) {//仅适用于列
        let data = {};
        if (this.type(params) == 'object' && this.type(queryArr) == 'array') {
            queryArr.forEach(e => {
                let val = params[e];
                if (!!val || val == 0) {
                    data[e] = params[e];
                }

            })

        }
        return data;
    },
    //创建当前时间
    formatCurrentTime(create_time) {
        let time = create_time ? strtotime(create_time)*1000 : Date.now();
        return php_date('Y-m-d H:i:s', time / 1000);
    },
    checkLogin(ctx) {
        let uid = ctx.cookies.get('uid');
        if (!uid) {
            return Tips[1005];
        } else {
            return Tips[0];
        }
    },
    generateToken(data){
        let created = Math.floor(Date.now() / 1000);
        let cert = fs.readFileSync(path.join(__dirname, '../config/pri.pem'));
        let token = jwt.sign({
            data,
            exp: created + 3600 * 24
        }, cert, {algorithm: 'RS256'});
        return token;
    },
    verifyToken(token){
        let cert = fs.readFileSync(path.join(__dirname, '../config/pub.pem')),res = {};
        try{
            let result = jwt.verify(token, cert, {algorithms: ['RS256']}) || {};
            let {exp = 0} = result,current = Math.floor(Date.now()/1000);
            if(current <= exp){
                res = result.data || {};
            }
        }catch(e){
        
        }
        return res;
        
    }
}

module.exports = util;