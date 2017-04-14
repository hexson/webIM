var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var db = require('./schema');

var onlineUsers = {};
var showData = {_id: 0, avatar: 1, id: 1, nickname: 1};

io.on('connection', function(socket){
  console.log('connected:', socket.id, new Date().toLocaleString());
  socket.on('login', function(obj){
    // socket.name = obj.token;
    db.User.findOne({token: obj.token}, {_id: 0, password: 0}, function(err, doc){
      if (doc){
        socket.userId = doc.id;
        onlineUsers[doc.id] = socket.id;
        console.log(onlineUsers);
        io.sockets.sockets[socket.id].emit('login', doc);
      }
      else io.sockets.sockets[socket.id].emit('login', null);
    });
  });
  socket.on('friends', function(list){
    var len = list.length,
    data = [],
    find = function(){
      len--;
      if (len < 0){
        io.sockets.sockets[socket.id].emit('friends', data);
        return;
      }
      db.User.findOne({id: list[len]}, showData, function(err, doc){
        if (doc){
          data.push(doc);
          find();
        }else io.sockets.sockets[socket.id].emit('friends', null);
      });
    };
    if (len) find();
    else io.sockets.sockets[socket.id].emit('friends', null);
  });
  socket.on('add', function(id, user){
    if (onlineUsers[id]){
      io.sockets.sockets[onlineUsers[id]].emit('add', {avatar: user.avatar, id: user.id, nickname: user.nickname});
    }else {
      io.sockets.sockets[socket.id].emit('add', '用户不在线，请稍后再试');
    }
  });
  socket.on('addAgree', function(own, id){
    db.User.findOne({id: own}, function(err, doc){
      console.log('doc: ', doc);
      var own_list = doc.friend_list ? doc.friend_list.split(',') : [];
      if (own_list.indexOf(id) >= 0){
        io.sockets.sockets[socket.id].emit('addAgree', '已经是好友');
      }else {
        own_list.push(id);
        console.log(own_list);
        db.User.updateOne({id: own}, {$set: {friend_list: own_list.join(',')}}, function(er, rt){
          if (rt.n > 0){
            db.User.findOne({id: id}, function(e, d){
              var f_list = d.friend_list ? d.friend_list.split(',') : [];
              if (f_list.indexOf(own) >= 0){
                io.sockets.sockets[onlineUsers[id]].emit('addAgree', '已经是好友');
              }else {
                f_list.push(own);
                db.User.updateOne({id: id}, {$set: {friend_list: f_list.join(',')}}, function($e, $r){
                  if (rt.n > 0){
                    io.sockets.sockets[socket.id].emit('addAgree', {
                      avatar: d.avatar,
                      id: d.id,
                      nickname: d.nickname
                    });
                    io.sockets.sockets[onlineUsers[id]].emit('addAgree', {
                      avatar: doc.avatar,
                      id: doc.id,
                      nickname: doc.nickname
                    });
                  }
                })
              }
            })
          }
        })
      }
    })
  });
  socket.on('addCancel', function(id){
    io.sockets.sockets[onlineUsers[id]].emit('addCancel', '对方拒绝了您的好友申请');
  });
  socket.on('message', function(obj){
    io.emit('message', obj);
    console.log(obj.username+'说：'+obj.content + ' ' + new Date().toLocaleString());
  });
  socket.on('disconnect', function(){
    console.log('disconnect:', socket.id, new Date().toLocaleString());
    delete onlineUsers[socket.userId];
    console.log(onlineUsers);
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


module.exports = server;
