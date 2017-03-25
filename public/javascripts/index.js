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
});