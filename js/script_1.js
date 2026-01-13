// Publications -> SELECTION swiper
// - Vertical (top-to-bottom)
// - Autoplay carousel
// - Text is revealed on hover via css/pub-selection.css
(function(){
  var container = document.querySelector('.timeline .swiper-container');
  if (!container) return;

  // Build the year list from *original* slides only (loop mode adds duplicates).
  var yearNodes = document.querySelectorAll('.timeline .swiper-slide:not(.swiper-slide-duplicate)');
  var years = Array.prototype.map.call(yearNodes, function (el) {
    return el.getAttribute('data-year') || '';
  });

  var timelineSwiper = new Swiper('.timeline .swiper-container', {
    direction: 'vertical',
    loop: true,
    speed: 900,
    autoplay: 3500,
    autoplayDisableOnInteraction: false,
    pagination: '.swiper-pagination',
    paginationBulletRender: function (swiper, index, className) {
      var year = years[index] || '';
      return '<span class="' + className + '">' + year + '</span>';
    },
    paginationClickable: true,
    nextButton: '.swiper-button-next',
    prevButton: '.swiper-button-prev'
  });

  // Pause the autoplay while the user is hovering (so they can read the overlay).
  container.addEventListener('mouseenter', function(){
    try { timelineSwiper.stopAutoplay(); } catch (e) {}
  });
  container.addEventListener('mouseleave', function(){
    try { timelineSwiper.startAutoplay(); } catch (e) {}
  });
})();