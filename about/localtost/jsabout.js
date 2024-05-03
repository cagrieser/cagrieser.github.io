$(function() {

   var rnd = function(min, max) {
      return Math.random() * (max - min) + min;
   };

   $(".hack-slider").height($(".slide:nth-child(1)", this).height());
   $(".slide:first-child", ".hack-slider").addClass('hack first');
   $(".slide:last-child", ".hack-slider").addClass('last')

   function slideEffect() {
      var timer = setInterval(function() {
         var rdH = parseInt(rnd(40, $(".hack").height())),
            rdW = parseInt(rnd(500, $(".hack").width() * 2)),
            rdT = parseInt(rnd(0, $(".hack").height() / 2)),
            rdL = parseInt(rnd(-500, $(".hack").width() / 2) + 200);
         $(".hack-slider .shapes").append('<span class="shape ' + rdH + ' ' + rdW + '" style="top:' + rdT + 'px; left:' + rdL + 'px; width:' + rdW + 'px;height:' + rdH + 'px;"></span>')
         $("." + rdH + "." + rdW).each(function() {
            $(this).delay(50).slideUp(0, function() {
               $(this).remove();
            });
         });
      }, 100);
      setTimeout(function() {
         clearInterval(timer)
      }, 1000);
   }

   slideEffect();

   function slideNext() {
      $('.slide.hack.last').removeClass('hack').fadeOut(200);
      if (!$(".slide").hasClass("hack")) {
         $(".slide").fadeOut(200);
         $(".slide:first-child", ".hack-slider").addClass("hack");
         $(".slide.hack").fadeIn(200);
         $(".hack-slider").height($(".slide.hack").height());
      } else {
         $(".slide.hack").fadeOut(200).next().addClass("hack").prev().removeClass("hack");
         $(".slide.hack").fadeIn(200);
         $(".hack-slider").height($(".slide.hack").height());
      }

      slideEffect();
   }

   function slidePrev() {
      $('.slide.hack.first').removeClass('hack').fadeOut(200);
      if (!$(".slide").hasClass("hack")) {
         $(".slide").fadeOut(200);
         $(".slide:last-child", ".hack-slider").addClass("hack");
         $(".slide.hack").fadeIn(200);
         $(".hack-slider").height($(".slide.hack").height());
      } else {
         $(".slide.hack").fadeOut(200).prev().addClass("hack").next().removeClass("hack");
         $(".slide.hack").fadeIn(200);
         $(".hack-slider").height($(".slide.hack").height());
      }
      slideEffect();
   }

   $(".arrow-right").click(function() {
      slideNext()
   });
   $(".arrow-left").click(function() {
      slidePrev()
   });

   var autoPlay = setInterval(function() {
      $(".arrow-right").click()
   }, 4000);
   $(".arrow").hover(function() {
      clearInterval(autoPlay);
   }, function() {
      autoPlay = setInterval(function() {
         $(".arrow-right").click()
      }, 4000);
   })

});