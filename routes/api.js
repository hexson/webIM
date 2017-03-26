var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/webim');
mongoose.Promise = require('bluebird');

var $u = require('../utils');

var UserSchema = new Schema({
  id: Number,
  account: String,
  nickname: String,
  password: String,
  online: Number,
  token: String,
  create_at: Number
}, {
  versionKey: false
});
var User = mongoose.model('user', UserSchema);

var CounterId = new Schema({
  table_name: String,
  sequence_value: Number
});
var UserId = mongoose.model('counter', CounterId);


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
  User.find({nickname: fuzzy && fuzzy === 'true' ? {$regex: nickname, $options: 'i'} : nickname}, {_id: 0, account: 1, nickname: 1}, function(err, doc){
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
  User.find({nickname: nickname}, function(er, rt){
    if (er) return res.send(er);
    if (rt.length){
      res.send({code: 0, msg: '该昵称已经被占用'});
    }else {
      UserId.findOneAndUpdate({table_name: 'user'}, {$inc: {sequence_value: 1}}, {new: true}, function(err, doc){
        if (err) return res.send(err);
        var user = new User({
          id: doc.sequence_value,
          account: '1000' + doc.sequence_value,
          nickname: nickname,
          password: password,
          online: 1,
          token: null,
          create_at: $u.getTime()
        });
        var promise = user.save();
        promise.then(function(result){
          res.send({
            code: 1,
            user: {
              token: result._id,
              id: result.id,
              account: result.account,
              nickname: result.nickname
            }
          });
        });
      });
    }
  });
});
router.post('/login', function(req, res, next){
  var account = req.body.account;
  var password = req.body.password;
  if (!account){
    res.send({code: 0, msg: '账号不能为空'});
    return;
  }
  if (!/^[1-9][0-9]+$/.test(account)){
    res.send({code: 0, msg: '账号不正确'});
    return;
  }
  if (!password){
    res.send({code: 0, msg: '密码不能为空'});
    return;
  }
  User.findOne({account: account}, function(err, doc){
    if (err) return res.send(err);
    if (doc && account == doc.account && password == doc.password){
      var token = $u.md5(doc._id + $u.getRandomStr(12));
      User.updateOne({_id: doc._id}, {$set: {token: token}}, function(error, result){
        if (error) return res.send(error);
        if (result.n > 0) res.send({code: 1, msg: '登录成功', token: token});
        else res.send({code: 0, msg: '登录失败'});
      })
      return;
    }
    res.send({code: 0, msg: '账号或密码不正确'});
  });
});

module.exports = router;
