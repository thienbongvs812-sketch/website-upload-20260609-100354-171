
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    setupMenu();
    setupCarousel();
    setupFilters();
    setupPlayer();
  });

  function setupMenu() {
    var button = document.querySelector('[data-menu-button]');
    var nav = document.querySelector('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupCarousel() {
    document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
      var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
      var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
      if (!slides.length) {
        return;
      }
      var index = 0;
      var timer = null;
      function show(next) {
        index = (next + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-active', i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      }
      function start() {
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5000);
      }
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          if (timer) {
            window.clearInterval(timer);
          }
          show(i);
          start();
        });
      });
      show(0);
      start();
    });
  }

  function setupFilters() {
    document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
      var scope = panel.parentElement || document;
      var input = panel.querySelector('[data-filter-input]');
      var year = panel.querySelector('[data-filter-year]');
      var type = panel.querySelector('[data-filter-type]');
      var category = panel.querySelector('[data-filter-category]');
      var empty = panel.querySelector('[data-filter-empty]');
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
      function normalize(value) {
        return String(value || '').toLowerCase().trim();
      }
      function apply() {
        var keyword = normalize(input && input.value);
        var yearValue = normalize(year && year.value);
        var typeValue = normalize(type && type.value);
        var categoryValue = normalize(category && category.value);
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year'),
            card.getAttribute('data-genre')
          ].join(' '));
          var matched = true;
          if (keyword && haystack.indexOf(keyword) === -1) {
            matched = false;
          }
          if (yearValue && normalize(card.getAttribute('data-year')) !== yearValue) {
            matched = false;
          }
          if (typeValue && normalize(card.getAttribute('data-type')).indexOf(typeValue) === -1) {
            matched = false;
          }
          if (categoryValue && normalize(card.getAttribute('data-category')) !== categoryValue) {
            matched = false;
          }
          card.classList.toggle('is-filter-hidden', !matched);
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('is-visible', visible === 0);
        }
      }
      [input, year, type, category].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });
    });
  }

  function setupPlayer() {
    document.querySelectorAll('[data-player]').forEach(function (player) {
      var stream = player.getAttribute('data-stream');
      var video = player.querySelector('video');
      var overlay = player.querySelector('.player-overlay');
      var button = player.querySelector('.player-start');
      var initialized = false;
      if (!stream || !video) {
        return;
      }
      function playVideo() {
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
        if (!initialized) {
          initialized = true;
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = stream;
            video.play().catch(function () {});
          } else if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls();
            hls.loadSource(stream);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
            video._hls = hls;
          } else {
            video.src = stream;
            video.play().catch(function () {});
          }
        } else {
          video.play().catch(function () {});
        }
      }
      if (overlay) {
        overlay.addEventListener('click', playVideo);
      }
      if (button) {
        button.addEventListener('click', function (event) {
          event.stopPropagation();
          playVideo();
        });
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        }
      });
    });
  }
})();
