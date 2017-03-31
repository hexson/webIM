var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/webim');
mongoose.Promise = require('bluebird');

var CounterId = new Schema({
  table_name: String,
  sequence_value: Number
});
var UserSchema = new Schema({
  id: Number,
  avatar: Number,
  account: String,
  nickname: String,
  password: String,
  signature: String,
  online: Number,
  token: String,
  create_at: Number
}, {versionKey: false});

var schema = {
  User: mongoose.model('user', UserSchema),
  UserId: mongoose.model('counter', CounterId)
};

module.exports = schema;