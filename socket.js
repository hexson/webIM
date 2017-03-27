var app = require('express')();
var mongoose = require('mongoose');
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var Schema = mongoose.Schema;


mongoose.connect('mongodb://localhost/webim');
mongoose.Promise = require('bluebird');


io.on('connection', function(socket){
  console.log('a user connected', socket);
  socket.on('login', function(obj){
    console.log(obj);
    return;
    socket.name = obj.userid;
    if(!onlineUsers.hasOwnProperty(obj.userid)) {
      onlineUsers[obj.userid] = obj.username;
      //在线人数+1
      onlineCount++;
    }
    io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
    console.log(obj.username+'加入了聊天室');
  });
  socket.on('message', function(obj){
    io.emit('message', obj);
    console.log(obj.username+'说：'+obj.content + ' ' + new Date().toLocaleString());
  });
  socket.on('disconnect', function(){
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