;(function(){
  /**
  * app Module
  *
  * a web im
  */
  angular.module('app', [])
  .run(['$rootScope', '$timeout', function($rootScope, $timeout){
    /* socket */
    var chat = $rootScope.chat = {
      apiRest: 'http://localhost:4000/api/',
      login: function(nickname, password){
        var toastr = this.toastr;
        // if (!account){
        //   return toastr('账号不能为空');
        // }
        // if (!/^[1-9][0-9]+$/.test(account)){
        //   return toastr('账号不正确');
        // }
        if (!nickname){
          return toastr('昵称不能为空');
        }
        if (/\s/.test(nickname)){
          return toastr('昵称不能包含空格');
        }
        if (!password){
          return toastr('密码不能为空');
        }
        this.post('login', {
          // account: account,
          nickname: nickname,
          password: md5(password)
        }, function(data){
          if (data.code){
            chat.init(chat.vm, nickname, data.token);
          }else {
            chat.clearLocalStorage();
            toastr(data.msg);
            chat.init(chat.vm);
          }
        });
      },
      signin: function(nickname, password, passwordagn){
        var toastr = this.toastr;
        if (!nickname){
          return toastr('昵称不能为空');
        }
        if (/\s/.test(nickname)){
          return toastr('昵称不能包含空格');
        }
        if (!password){
          return toastr('密码不能为空');
        }
        if (passwordagn != password){
          return toastr('两次密码不一致');
        }
        this.post('signin', {
          // account: account,
          nickname: nickname,
          password: md5(password),
          passwordagn: md5(passwordagn)
        }, function(data){
          if (data.code){
            chat.init(chat.vm, nickname, data.token);
          }else {
            chat.clearLocalStorage();
            toastr(data.msg);
            chat.init(chat.vm);
          }
        });
      },
      get: function(url, formdata, success, error){
        this.ajax.call(this, 'GET', url, formdata, success, error);
      },
      post: function(url, formdata, success, error){
        this.ajax.call(this, 'POST', url, formdata, success, error);
      },
      ajax: function(type, url, formdata, success, error){
        var that = this;
        $.ajax({
          type: type,
          url: (url.indexOf('http') >= 0 ? url : that.apiRest + url),
          data: formdata,
          dataType: 'json',
          success: success,
          error: error || function(err){
            console.log(err);
          }
        });
      },
      toastr: function(str, timeout){
        var id = 'toastr_' + new Date().getTime().toString(16) + Math.random().toString().substr(3, 6);
        var html = '<div id="' + id + '" class="toastr toastr-animation"><span>' + str + '</span></div>';
        $('body').append(html);
        setTimeout(function(){
          $('#' + id).fadeOut();
          setTimeout(function(){
            $('#' + id).remove();
          }, 500);
        }, timeout || 2000);
      },
      storage: window.localStorage,
      getLocalStorage: function(item){
        return this.storage.getItem(item);
      },
      setLocalStorage: function(item, value){
        this.storage.setItem(item, value);
      },
      delLocalStorage: function(item){
        this.storage.removeItem(item);
      },
      clearLocalStorage: function(){
        this.storage.clear();
      },
      showLoginView: function(){
        $('.webim-sign').show();
        $('#signinView,.webim-wrap').hide();
        $('#loginView').show();
      },
      showSigninView: function(){
        $('.webim-sign').show();
        $('#loginView,.webim-wrap').hide();
        $('#signinView').show();
      },
      showChat: function(){
        $('.webim-sign').hide();
        $('.webim-wrap').show();
      },
      logout: function(){
        this.socket.disconnect();
        this.showLoginView();
      },
      init: function(vm, account, token){
        if (account && token){
          this.setLocalStorage('account', account);
          this.setLocalStorage('token', token);
        }
        if (!this.getLocalStorage('token')){
          this.showLoginView();
          return;
        }
        var that = this;
        this.vm = vm;
        this.socket = io.connect('http://localhost:4001');
        this.socket.emit('login', {token: this.getLocalStorage('token')});
        this.socket.on('login', function(data){
          console.log('login: ', data);
          if (data){
            vm.user = data;
            $timeout(angular.noop);
            that.socket.emit('friends', data.friend_list.split(','));
            chat.showChat();
          }else {
            chat.showLoginView();
          }
        });
        this.socket.on('friends', function(data){
          console.log('friends: ', data);
          if (data){
            vm.friends = data;
          }else {
            vm.friends = [];
            vm.not_friends = true;
          }
          $timeout(angular.noop);
        });
        this.socket.on('add', function(data){
          console.log('add: ', data);
          if (typeof data === 'string'){
            chat.toastr(data);
          }else {
            var msgs = vm.msgs || [];
            msgs.push(data);
            vm.msgs = msgs;
            $timeout(angular.noop);
          }
        });
        this.socket.on('addAgree', function(data){
          console.log('addAgree: ', data);
          if (typeof data === 'string'){
            chat.toastr(data);
          }else {
            vm.friends = vm.friends || [];
            vm.friends.push(data);
            vm.user.friend_list += ',' + data.id;
            chat.toastr('已成为好友啦');
            $timeout(angular.noop);
          }
        });
        this.socket.on('addCancel', function(data){
          console.log('addCancel: ', data);
          chat.toastr(data);
        });
        this.socket.on('getmsg', function(data){
          console.log('getmsg: ', data);
          vm.msgList = data;
          $timeout(angular.noop);
          $timeout(function(){
            $('.im-cvs-cont').scrollTop($('.im-cvs-cont')[0].scrollHeight);
          });
        });
        this.socket.on('message', function(data){
          console.log('message: ', data);
          console.info(data.from == vm.user.id);
          if (data.from == vm.user.id){
            vm.msgList.push(data);
            for (var i = 0; i < vm.friends.length; i++){
              if (vm.friends[i].id == data.to){
                vm.friends[i].content = data.content;
                vm.friends[i].time = data.send_at;
                break;
              }
            }
            vm.msg = null;
          }
          if (data.to = vm.user.id){
            if (data.from == vm.toId){
              vm.msgList.push(data);
            }else {
              for (var i = 0; i < vm.friends.length; i++){
                if (vm.friends[i].id == data.from){
                  vm.friends[i].content = data.content;
                  vm.friends[i].time = data.send_at;
                  vm.friends[i].count = vm.friends[i].count ? (+vm.friends[i].count+1) : 1;
                  break;
                }
              }
            }
          }
          $timeout(angular.noop);
          $timeout(function(){
            $('.im-cvs-cont').scrollTop($('.im-cvs-cont')[0].scrollHeight);
          });
        });
      }
    };
  }])
  .controller('webim', ['$scope', '$rootScope', '$timeout', function(vm, $rootScope, $timeout){
    var scrollCof = {
      cursorcolor: '#d1d7e6',
      cursorborder: '0'
    };
    $('.im-f-list').niceScroll(scrollCof);
    $('.im-cvs-cont').niceScroll(scrollCof);
    var chat = $rootScope.chat;
    chat.init(vm);
    vm.loginaccount = chat.getLocalStorage('account');
    vm.tFocusBlur = function(){
      vm.sendBg = !vm.sendBg;
    }
    vm.signinGo = function(){
      chat.showSigninView()
    }
    vm.loginGo = function(){
      chat.showLoginView()
    }
    vm.login = function(e){
      if (e && e.keyCode !== 13) return;
      chat.login(vm.loginaccount, vm.loginpassword)
    }
    vm.signin = function(e){
      if (e && e.keyCode !== 13) return;
      chat.signin(vm.signinaccount, vm.signinpassword, vm.signinpasswordagn)
    }
    vm.logout = function(){
      var account = chat.getLocalStorage('account');
      chat.clearLocalStorage();
      vm.loginaccount = account;
      chat.setLocalStorage('account', account);
      chat.logout();
    }
    vm.setSign = function(){
      vm.siinshow = true;
      vm.signature = vm.user.signature;
      $timeout(function(){
        $('.webim-info input').trigger('focus');
      });
    }
    vm.inputSi = function(e){
      if (e && e.keyCode !== 13) return;
      if (!vm.signature){
        return vm.siinshow = false;
      }
      if (vm.signature.length > 28){
        return chat.toastr('签名长度不能大于18个字');
      }
      chat.post('setsignature', {token: vm.user.token, signature: vm.signature}, function(data){
        vm.siinshow = false;
        if (data.code){
          vm.user.signature = vm.signature;
        }else {
          chat.toastr(data.msg);
        }
        $timeout(angular.noop);
      })
    }
    vm.find = function(e){
      if (e && e.keyCode !== 13) return;
      if (!vm.findUser){
        return chat.toastr('搜索昵称不能为空');
      }
      chat.get('finduser', {nickname: vm.findUser, fuzzy: true}, function(data){
        vm.searchShow = true;
        vm.searchList = data.users;
        $timeout(angular.noop);
      })
    }
    vm.searchHide = function(){
      vm.findUser = null;
      vm.searchShow = false;
    }
    vm.add = function(e, id){
      if ($(e.target).html() == '已发送'){
        return chat.toastr('好友申请请求已发送');
      }
      $(e.target).html('已发送');
      chat.socket.emit('add', id, vm.user);
    }
    vm.addAgree = function(id, i){
      vm.msgs.splice(i, 1);
      chat.socket.emit('addAgree', vm.user.id, id);
    }
    vm.addCancel = function(id, i){
      vm.msgs.splice(i, 1);
      chat.socket.emit('addCancel', id);
    }
    vm.itemFocus = function(v){
      vm.itemcls = {};
      vm.itemcls[v.id] = true;
      vm.toId = v.id;
      vm.toName = v.nickname;
      vm.toAvatar = v.avatar;
      chat.socket.emit('getmsg', vm.user.id, v.id);
      setTimeout(function(){
        $('textarea').trigger('focus');
      }, 10);
    }
    vm.replace = function(e){
      if (e && e.keyCode == 13){
        e.preventDefault();
      }
    }
    vm.send = function(e){
      if (e && e.keyCode !== 13) return;
      if (!vm.msg) return chat.toastr('发送内容不能为空');
      chat.socket.emit('message', vm.user.id, vm.toId, vm.msg);
    }
  }])
})();