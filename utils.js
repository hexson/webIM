var md5 = require('blueimp-md5');

var utils = {
  /*
   * @Get now timestamp
   */
  getTime: function(){
    return (Date.now() + '').substr(0, 10);
  },
  /*
   * @Get an random strings
   * @param len{Number}  strings length
   * @param upperCase{Boolean}  strings have upper case
   */
  getRandomStr: function(len, upperCase){
    var str = '0123456789abcdefghijklmnopqrstuvwxyz'
    str += upperCase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '';
    var l = str.length, i, outstr = '';
    for (i = 0; i < len; i++){
      outstr += str.charAt(Math.floor(Math.random() * l));
    }
    return outstr;
  },
  /*
   * @String to md5
   * @param str{String}  any
   */
  md5: function(str){
    return md5(str);
  }
};

module.exports = utils;