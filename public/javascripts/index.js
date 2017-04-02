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
      apiRest: 'http://localhost:3000/api/',
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
            chat.init($rootScope, nickname, data.token);
          }else {
            chat.clearLocalStorage();
            toastr(data.msg);
            chat.init($rootScope);
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
            chat.init($rootScope, nickname, data.token);
          }else {
            chat.clearLocalStorage();
            toastr(data.msg);
            chat.init($rootScope);
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
      init: function(vm, account, token){
        if (account && token){
          this.setLocalStorage('account', account);
          this.setLocalStorage('token', token);
        }
        if (!this.getLocalStorage('token')){
          this.showLoginView();
          return;
        }
        this.socket = io.connect('http://localhost:4000');
        this.socket.emit('login', {token: this.getLocalStorage('token')});
        this.socket.on('login', function(data){
          if (data){
            vm.socketid = data.id;
            vm.user = data.user;
            $timeout(angular.noop);
            chat.showChat();
          }else {
            chat.showLoginView();
          }
        });
      }
    };
  }])
  .controller('webim', ['$scope', '$rootScope', function(vm, $rootScope){
    $('.im-f-list').niceScroll({
      cursorcolor: '#d4d4d4',
      cursorborder : '0'
    });
    $('.im-f-list').on('click', '.im-f-item', function(){
      $('.im-f-item').removeClass('im-item-active');
      $(this).addClass('im-item-active');
      $('textarea').focus();
    });
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
  }])
})();