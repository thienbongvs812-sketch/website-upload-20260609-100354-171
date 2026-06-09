(function () {
  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  function initMobileNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function initHeroSlider() {
    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function cardMatches(card, query, typeValue, yearValue) {
    var haystack = normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-region'),
      card.getAttribute('data-type'),
      card.getAttribute('data-year'),
      card.getAttribute('data-tags'),
      card.getAttribute('data-genre')
    ].join(' '));
    var cardType = normalize(card.getAttribute('data-type'));
    var cardYear = normalize(card.getAttribute('data-year'));
    var queryOk = !query || haystack.indexOf(query) !== -1;
    var typeOk = !typeValue || cardType.indexOf(typeValue) !== -1;
    var yearOk = !yearValue || cardYear.indexOf(yearValue) !== -1;
    return queryOk && typeOk && yearOk;
  }

  function initFilters() {
    var scope = document.querySelector('[data-filter-scope]');
    var grid = document.querySelector('[data-card-grid]');
    if (!scope || !grid) {
      return;
    }
    var input = scope.querySelector('[data-search-input]');
    var typeFilter = scope.querySelector('[data-type-filter]');
    var yearFilter = scope.querySelector('[data-year-filter]');
    var emptyState = scope.querySelector('[data-empty-state]');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-card]'));
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q');

    if (input && initialQuery) {
      input.value = initialQuery;
    }

    function applyFilter() {
      var query = normalize(input ? input.value : '');
      var typeValue = normalize(typeFilter ? typeFilter.value : '');
      var yearValue = normalize(yearFilter ? yearFilter.value : '');
      var visible = 0;
      cards.forEach(function (card) {
        var show = cardMatches(card, query, typeValue, yearValue);
        card.classList.toggle('is-hidden', !show);
        if (show) {
          visible += 1;
        }
      });
      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }
    }

    [input, typeFilter, yearFilter].forEach(function (control) {
      if (!control) {
        return;
      }
      control.addEventListener('input', applyFilter);
      control.addEventListener('change', applyFilter);
    });

    applyFilter();
  }

  function smoothAnchorPlay() {
    var playLinks = document.querySelectorAll('a[href="#player"]');
    playLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        window.setTimeout(function () {
          var playButton = document.querySelector('[data-play-button]');
          if (playButton) {
            playButton.focus({ preventScroll: true });
          }
        }, 360);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initHeroSlider();
    initFilters();
    smoothAnchorPlay();
  });
})();
