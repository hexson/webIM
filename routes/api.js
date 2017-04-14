var express = require('express');
var router = express.Router();

var $u = require('../utils');
var db = require('../schema');


router.get('/finduser', function(req, res, next){
  var nickname = req.query.nickname;
  if (!nickname){
    res.send({code: 0, msg: '昵称不能为空'});
    return;
  }
  if (/\s/.test(nickname)){
    res.send({code: 0, msg: '昵称不能包含空格'});
    return;
  }
  var fuzzy = req.query.fuzzy;
  var showData = {_id: 0, avatar: 1, id: 1, nickname: 1};
  db.User.find({nickname: fuzzy && fuzzy === 'true' ? {$regex: nickname, $options: 'i'} : nickname}, showData, function(err, doc){
    if (err) return res.send(err);
    res.send({
      code: 1,
      fuzzy: (fuzzy && fuzzy === 'true' ? true : false),
      users: doc
    });
  })
});
router.post('/signin', function(req, res, next){
  var nickname = req.body.nickname;
  var password = req.body.password;
  if (!nickname){
    res.send({code: 0, msg: '昵称不能为空'});
    return;
  }
  if (/\s/.test(nickname)){
    res.send({code: 0, msg: '昵称不能包含空格'});
    return;
  }
  if (!password){
    res.send({code: 0, msg: '密码不能为空'});
    return;
  }
  db.User.find({nickname: nickname}, function(er, rt){
    if (er) return res.send(er);
    if (rt.length){
      res.send({code: 0, msg: '该昵称已经被占用'});
    }else {
      db.GetId.findOneAndUpdate({table_name: 'user'}, {$inc: {sequence_value: 1}}, {new: true}, function(err, doc){
        if (err) return res.send(err);
        var user = new db.User({
          id: doc.sequence_value,
          // avatar: 1,
          avatar: Math.floor(Math.random() * 10) + 1,
          account: '1000' + doc.sequence_value,
          nickname: nickname,
          password: password,
          signature: '',
          friend_list: '',
          token: null,
          create_at: $u.getTime()
        });
        var promise = user.save();
        promise.then(function(result){
          var token = $u.md5(result._id + $u.getRandomStr(12));
          db.User.updateOne({_id: result._id}, {$set: {token: token}}, function(error, rt){
            if (error) return res.send(error);
            console.log(rt);
            res.send({
              code: 1,
              msg: '注册成功',
              token: token
            });
          })
        });
      });
    }
  });
});
router.post('/login', function(req, res, next){
  var account = req.body.account;
  var nickname = req.body.nickname;
  var password = req.body.password;
  // if (!account){
  //   res.send({code: 0, msg: '账号不能为空'});
  //   return;
  // }
  // if (!/^[1-9][0-9]+$/.test(account)){
  //   res.send({code: 0, msg: '账号不正确'});
  //   return;
  // }
  if (!nickname){
    res.send({code: 0, msg: '昵称不能为空'});
    return;
  }
  if (!password){
    res.send({code: 0, msg: '密码不能为空'});
    return;
  }
  // db.User.findOne({account: account, nickname: nickname}, function(err, doc){
  db.User.findOne({nickname: nickname}, function(err, doc){
    if (err) return res.send(err);
    if (doc && (account == doc.account || nickname == doc.nickname) && password == doc.password){
      var token = $u.md5(doc._id + $u.getRandomStr(12));
      db.User.updateOne({_id: doc._id}, {$set: {token: token}}, function(error, result){
        if (error) return res.send(error);
        if (result.n > 0) res.send({code: 1, msg: '登录成功', token: token});
        else res.send({code: 0, msg: '登录失败'});
      })
      return;
    }
    if (doc){
      res.send({code: 0, msg: '账号或密码不正确'});
    }else {
      res.send({code: 0, msg: '账号不存在'});
    }
  });
});

module.exports = router;
