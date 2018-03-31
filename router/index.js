const user = require('./user');
const note = require('./note');
const blog = require('./blog');
const img = require('./img');
module.exports = function(app){
    app.use(user.routes()).use(user.allowedMethods());
    app.use(note.routes()).use(note.allowedMethods());
    app.use(blog.routes()).use(blog.allowedMethods());
    app.use(img.routes()).use(img.allowedMethods());
}
