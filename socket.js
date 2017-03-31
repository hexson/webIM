var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var db = require('./schema');


io.on('connection', function(socket){
  console.log('connected:', socket.id, new Date().toLocaleString());
  socket.on('login', function(obj){
    socket.name = obj.token;
    db.User.findOne({token: obj.token}, {_id: 0, password: 0}, function(err, doc){
      if (doc) io.emit('login', {id: socket.id, user: doc});
      else io.emit('login', null);
    });
  });
  socket.on('message', function(obj){
    io.emit('message', obj);
    console.log(obj.username+'说：'+obj.content + ' ' + new Date().toLocaleString());
  });
  socket.on('disconnect', function(){
    console.log('disconnect:', socket.id, new Date().toLocaleString());
    return;
    //将退出的用户从在线列表中删除
    if(onlineUsers.hasOwnProperty(socket.name)) {
      //退出用户的信息
      var obj = {userid:socket.name, username:onlineUsers[socket.name]};
      
      //删除
      delete onlineUsers[socket.name];
      //在线人数-1
      onlineCount--;
      
      //向所有客户端广播用户退出
      io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
      console.log(obj.username+'退出了聊天室');
    }
  });
});


server.listen(4000);