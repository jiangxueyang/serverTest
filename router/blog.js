const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db/index');
const fs = require('fs');
const asyncBusboy = require('async-busboy');
//创建一篇博客，必须登录
router.post('/oa/user/addBlog', async (ctx, next) => {
    let data = Utils.filter(ctx.request.body, ['title', 'content', 'tag_id', 'note_id', 'brief', 'publish', 'create_time']),
        {uid} = ctx.state  || {};
    let res = Utils.formatData(data, [
        {key: 'note_id', type: 'number'},
        {key: 'title', type: 'string'},
        {key: 'brief', type: 'string'},
        {key: 'content', type: 'string'},
        {key: 'publish', type: 'number'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {title = '无标题', content = '', note_id = '', brief = '', publish = 0, create_time = ''} = data;
    create_time = Utils.formatCurrentTime(create_time);
    let sql = `INSERT INTO t_blog(title,content,note_id,create_time,uid,brief,publish) VALUES (?,?,?,?,?,?,?)`,
        value = [title, content, note_id, create_time, uid, brief, publish];
    await db.query(sql, value).then(async res => {
        let {insertId: id} = res;
        ctx.body = {
            ...Tips[0],
            data: {id}
        }
        
    }).catch(e => {
        ctx.body = Tips[1002];
    });
    
});

//修改博客
router.post('/oa/user/modifyBlog', async (ctx, next) => {
    let data = Utils.filter(ctx.request.body, ['title', 'origin_tag_id', 'content', 'tag_id', 'note_id', 'id', 'brief', 'publish', 'create_time']),
        {uid} = ctx.state  || {};
    let res = Utils.formatData(data, [
        {key: 'note_id', type: 'number'},
        {key: 'id', type: 'number'},
        {key: 'title', type: 'string'},
        {key: 'brief', type: 'string'},
        {key: 'content', type: 'string'},
        {key: 'publish', type: 'number'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {title, content, note_id, id, brief, publish = 0, create_time = ''} = data;
    create_time = Utils.formatCurrentTime(create_time);
    let sql = `UPDATE t_blog set title=?,content=?,note_id=?,brief=?,publish=?,create_time=? WHERE uid=? AND id=?;`,
        value = [title, content, note_id, brief, publish, create_time, uid, id];
    
    await db.query(sql, value).then(async res => {
        ctx.body = Tips[0];
    }).catch(e => {
        ctx.body = Tips[1002];
    })
    
});

//删除博客
router.post('/oa/user/removeBlog', async (ctx, next) => {
    let data = Utils.filter(ctx.request.body, ['id']), {uid} = ctx.state  || {};
    let res = Utils.formatData(data, [
        {key: 'id', type: 'number'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {id} = data;
    let sql = 'UPDATE t_blog set is_delete=1 WHERE id=? AND uid=?', value = [id, uid];
    await db.query(sql, value).then(async res => {
        ctx.body = Tips[0];
    }).catch(e => {
        ctx.body = Tips[1002];
    });
});

//发布或上线博客
router.post('/oa/user/changeBlogStatus', async (ctx, next) => {
    let data = Utils.filter(ctx.request.body, ['id', 'publish']), uid = ctx.session.uid;
    let res = Utils.formatData(data, [
        {key: 'id', type: 'number'},
        {key: 'publish', type: 'number'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {id, publish} = data;
    await db.query('UPDATE t_blog set publish=? WHERE uid=? AND id=?', [publish, uid, id]).then(res => {
        ctx.body = Tips[0];
    }).catch(e => {
        ctx.body = Tips[1002];
    })
})

//分页查询我所有的博客 type:0：我所有的 1 根据笔记本查询
router.get('/oa/user/myBlog', async (ctx, next) => {
    let data = Utils.filter(ctx.request.query, ['pageSize', 'pageNum', 'note_id', 'type']), {uid} = ctx.state  || {};
    let res = Utils.formatData(data, [
        {key: 'note_id', type: 'number'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let filterData = {};
    for (let i in data) {
        filterData[i] = parseInt(data[i])
    }
    let {pageSize = 15, pageNum = 1, note_id, type = 0} = filterData;
    let offset = (pageNum - 1) * pageSize, sql, sql1;
    if (+type === 1) {
        sql = `SELECT content,id,title,note_id,brief,create_time,update_time,publish  FROM  t_blog WHERE uid=${uid} AND note_id=${note_id} AND is_delete=0 ORDER BY create_time DESC limit ${offset},${pageSize};`;
        sql1 = `SELECT count(1) FROM  t_blog WHERE uid=${uid} AND note_id=${note_id} AND is_delete=0;`;
    } else {
        sql = `SELECT content,id,title,note_id,brief,create_time,update_time,publish  FROM  t_blog WHERE uid=${uid} AND is_delete=0 ORDER BY create_time DESC limit ${offset},${pageSize};`;
        sql1 = `SELECT count(1) FROM  t_blog WHERE uid=${uid} AND is_delete=0;`;
    }
    await db.query(sql1+sql).then(async result => {
        let res1 = result[0],res2 = result[1],total = 0,list = [];
        if(res1 && res1.length >0 && res2 && res2.length >0){
            total = res1[0]['count(1)'];
            list = res2;
        }
        ctx.body = {
            ...Tips[0],
            data: {
                list,
                pageSize,
                total
            }
        };
        
    }).catch(e => {
        ctx.body = Tips[1002];
    })
});
//查看博客详情
router.get('/oa/blog/:id', async (ctx, next) => {
    let data = ctx.params;
    let res = Utils.formatData(data, [
        {key: 'id', type: 'number'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {id} = data;
    id = parseInt(id);
    let sql = `SELECT content,id,title,note_id,brief,create_time,publish  FROM t_blog WHERE id=${id} AND is_delete=0;`;
    await db.query(sql).then(res => {
        let detail = res[0] || [];
        if(detail.length >0){
            ctx.body = {...Tips[0],data:detail}
    
        }else{
            ctx.body = Tips[1003]
        }
    }).catch(e => {
        ctx.body = Tips[1002];
    })
});

//识别md文件
router.post('/oa/user/recognizeFile', async (ctx, next) => {
    try {
        let data = await asyncBusboy(ctx.req);
        let {files = []} = data;
        if (files.length > 0) {
            let file = files[0];
            let {path: filePath} = file;
            try {
                let content = fs.readFileSync(filePath, 'utf-8');
                fs.unlinkSync(filePath);//清除
                ctx.body = {
                    ...Tips[0],
                    data: content
                }
            } catch (e) {
                ctx.body = Tips[1008];
            }
        } else {
            ctx.body = Tips[1008];
        }
    } catch (e) {
        ctx.body = Tips[1008];
    }
    
    
});

module.exports = router;