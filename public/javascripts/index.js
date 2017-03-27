;$(function(){
  $('.im-f-list').niceScroll({
    cursorcolor: '#d4d4d4',
    cursorborder : '0'
  });
  $('.im-f-list').on('click', '.im-f-item', function(){
  	$('.im-f-item').removeClass('im-item-active');
  	$(this).addClass('im-item-active');
  });
  $('textarea').focus(function(){
  	$('.im-cvs-send').addClass('bfff');
  }).blur(function(){
  	$('.im-cvs-send').removeClass('bfff');
  });
  /* socket */
  var chat = {
    login: function(){},
    init: function(){
      this.socket = io.connect('http://localhost:4000');
      console.log(this.socket);
    }
  };
  chat.init();
  // $.ajax({
  //   type: 'post',
  //   url: 'http://localhost:3000/api/login',
  //   data: {account: '10001', password: md5('123456')},
  //   dataType: 'json',
  //   success: function(data){
  //     console.log(data);
  //   },
  //   error: function(err){
  //     console.log(err);
  //   }
  // })
});