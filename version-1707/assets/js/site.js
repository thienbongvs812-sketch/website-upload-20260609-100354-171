(function () {
    'use strict';

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function setupNavigation() {
        var toggle = document.querySelector('[data-nav-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');

        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var carousel = document.querySelector('[data-hero-carousel]');

        if (!carousel) {
            return;
        }

        var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
        var prev = carousel.querySelector('[data-hero-prev]');
        var next = carousel.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function play() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                play();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                play();
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot') || 0));
                play();
            });
        });

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', play);
        show(0);
        play();
    }

    function getQueryValue(name) {
        var params = new URLSearchParams(window.location.search);
        return params.get(name) || '';
    }

    function setupFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));

        panels.forEach(function (panel) {
            var section = panel.closest('.content-section') || document;
            var list = section.querySelector('[data-filter-list]');
            var cards = list ? Array.prototype.slice.call(list.querySelectorAll('[data-movie-card]')) : [];
            var input = panel.querySelector('[data-filter-input]');
            var region = panel.querySelector('[data-filter-region]');
            var type = panel.querySelector('[data-filter-type]');
            var year = panel.querySelector('[data-filter-year]');
            var reset = panel.querySelector('[data-filter-reset]');
            var count = panel.querySelector('[data-filter-count]');

            if (!cards.length) {
                return;
            }

            if (input && getQueryValue('q')) {
                input.value = getQueryValue('q');
            }

            function normalize(value) {
                return String(value || '').toLowerCase().trim();
            }

            function cardText(card) {
                return normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-year'),
                    card.textContent
                ].join(' '));
            }

            function applyFilter() {
                var keyword = normalize(input && input.value);
                var regionValue = normalize(region && region.value);
                var typeValue = normalize(type && type.value);
                var yearValue = normalize(year && year.value);
                var visible = 0;

                cards.forEach(function (card) {
                    var text = cardText(card);
                    var matchesKeyword = !keyword || text.indexOf(keyword) !== -1;
                    var matchesRegion = !regionValue || normalize(card.getAttribute('data-region')).indexOf(regionValue) !== -1 || text.indexOf(regionValue) !== -1;
                    var matchesType = !typeValue || normalize(card.getAttribute('data-type')).indexOf(typeValue) !== -1 || text.indexOf(typeValue) !== -1;
                    var matchesYear = !yearValue || normalize(card.getAttribute('data-year')).indexOf(yearValue) !== -1;
                    var matches = matchesKeyword && matchesRegion && matchesType && matchesYear;

                    card.classList.toggle('is-hidden', !matches);

                    if (matches) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = '显示 ' + visible + ' / ' + cards.length + ' 部';
                }
            }

            [input, region, type, year].forEach(function (control) {
                if (!control) {
                    return;
                }

                control.addEventListener('input', applyFilter);
                control.addEventListener('change', applyFilter);
            });

            if (reset) {
                reset.addEventListener('click', function () {
                    if (input) {
                        input.value = '';
                    }

                    if (region) {
                        region.value = '';
                    }

                    if (type) {
                        type.value = '';
                    }

                    if (year) {
                        year.value = '';
                    }

                    applyFilter();
                });
            }

            applyFilter();
        });
    }

    var hlsLoader = null;

    function ensureHls(callback, onError) {
        if (window.Hls) {
            callback(window.Hls);
            return;
        }

        if (!hlsLoader) {
            hlsLoader = new Promise(function (resolve, reject) {
                var script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js';
                script.async = true;
                script.onload = function () {
                    resolve(window.Hls);
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        hlsLoader.then(callback).catch(onError);
    }

    function setupPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

        players.forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-player-start]');
            var status = player.querySelector('[data-player-status]');
            var started = false;

            if (!video) {
                return;
            }

            function setStatus(message) {
                if (status) {
                    status.textContent = message;
                }
            }

            function playVideo() {
                var promise = video.play();

                if (promise && typeof promise.catch === 'function') {
                    promise.catch(function () {
                        setStatus('浏览器阻止自动播放，请再次点击视频播放');
                    });
                }
            }

            function start() {
                var source = video.getAttribute('data-src') || '';

                if (!source || started) {
                    return;
                }

                started = true;
                player.classList.add('is-playing');
                setStatus('正在加载播放源');

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    video.addEventListener('loadedmetadata', playVideo, { once: true });
                    video.load();
                    setStatus('使用浏览器原生 HLS 播放');
                    return;
                }

                ensureHls(function (Hls) {
                    if (!Hls || !Hls.isSupported()) {
                        video.src = source;
                        video.load();
                        playVideo();
                        setStatus('已尝试直接播放 m3u8 源');
                        return;
                    }

                    var hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90
                    });

                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, function () {
                        setStatus('播放源已就绪');
                        playVideo();
                    });
                    hls.on(Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            setStatus('播放源加载异常，请刷新后重试');
                        }
                    });
                }, function () {
                    video.src = source;
                    video.load();
                    playVideo();
                    setStatus('HLS 组件加载失败，已尝试直接播放');
                });
            }

            if (button) {
                button.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    start();
                });
            }

            player.addEventListener('click', function (event) {
                if (event.target === video) {
                    return;
                }

                start();
            });
        });
    }

    ready(function () {
        setupNavigation();
        setupHero();
        setupFilters();
        setupPlayers();
    });
}());
