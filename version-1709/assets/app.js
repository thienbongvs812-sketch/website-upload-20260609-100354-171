(function () {
    'use strict';

    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function normalize(value) {
        return String(value || '').trim().toLowerCase();
    }

    function initNavigation() {
        var toggle = qs('[data-nav-toggle]');
        var nav = qs('[data-main-nav]');
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener('click', function () {
            nav.classList.toggle('open');
        });
    }

    function initHero() {
        var carousel = qs('[data-hero-carousel]');
        if (!carousel) {
            return;
        }
        var slides = qsa('[data-hero-slide]', carousel);
        var dots = qsa('[data-hero-dot]', carousel);
        if (slides.length <= 1) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            start();
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var nextIndex = parseInt(dot.getAttribute('data-hero-dot'), 10) || 0;
                show(nextIndex);
                restart();
            });
        });
        start();
    }

    function initLocalFilters() {
        qsa('[data-filter-panel]').forEach(function (panel) {
            var input = qs('[data-filter-input]', panel);
            var yearSelect = qs('[data-year-filter]', panel);
            var reset = qs('[data-filter-reset]', panel);
            var count = qs('[data-filter-count]', panel);
            var section = panel.closest('section') || document;
            var cards = qsa('[data-movie-card]', section);

            function apply() {
                var keyword = normalize(input && input.value);
                var year = normalize(yearSelect && yearSelect.value);
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = normalize(card.getAttribute('data-search'));
                    var cardYear = normalize(card.getAttribute('data-year'));
                    var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                    var matchesYear = !year || cardYear.indexOf(year) !== -1;
                    var show = matchesKeyword && matchesYear;
                    card.classList.toggle('hidden', !show);
                    if (show) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 部';
                }
            }

            if (input) {
                input.addEventListener('input', apply);
            }
            if (yearSelect) {
                yearSelect.addEventListener('change', apply);
            }
            if (reset) {
                reset.addEventListener('click', function () {
                    if (input) {
                        input.value = '';
                    }
                    if (yearSelect) {
                        yearSelect.value = '';
                    }
                    apply();
                });
            }
            apply();
        });
    }

    var cachedIndex = null;

    function fetchIndex(path) {
        if (cachedIndex) {
            return Promise.resolve(cachedIndex);
        }
        return fetch(path).then(function (response) {
            if (!response.ok) {
                throw new Error('search index not found');
            }
            return response.json();
        }).then(function (data) {
            cachedIndex = data;
            return data;
        });
    }

    function initGlobalSearch() {
        qsa('[data-global-search]').forEach(function (form) {
            var input = qs('input[name="q"]', form);
            var results = qs('[data-global-results]', form.parentElement || document) || qs('[data-global-results]');
            var indexPath = form.getAttribute('data-search-index') || 'assets/search-index.json';
            if (!input || !results) {
                return;
            }

            function render(items, keyword) {
                if (!keyword) {
                    results.classList.remove('active');
                    results.innerHTML = '';
                    return;
                }
                if (!items.length) {
                    results.classList.add('active');
                    results.innerHTML = '<div class="global-result-item"><h3>没有找到相关影片</h3><p>请尝试输入年份、地区、类型或更短的片名。</p></div>';
                    return;
                }
                results.classList.add('active');
                results.innerHTML = items.slice(0, 12).map(function (item) {
                    return '<a class="global-result-item" href="' + item.url + '">' +
                        '<h3>' + item.title + '</h3>' +
                        '<p>' + item.year + ' · ' + item.region + ' · ' + item.genre + '</p>' +
                        '<p>' + item.oneLine + '</p>' +
                        '</a>';
                }).join('');
            }

            function search() {
                var keyword = normalize(input.value);
                fetchIndex(indexPath).then(function (data) {
                    var items = data.filter(function (item) {
                        return normalize(item.search).indexOf(keyword) !== -1;
                    });
                    render(items, keyword);
                }).catch(function () {
                    results.classList.add('active');
                    results.innerHTML = '<div class="global-result-item"><h3>搜索索引加载失败</h3><p>请确认 assets/search-index.json 已随网站一起上传。</p></div>';
                });
            }

            input.addEventListener('input', search);
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                search();
            });
        });
    }

    function initPlayers() {
        qsa('[data-player]').forEach(function (frame) {
            var video = qs('video', frame);
            var button = qs('[data-player-button]', frame);
            var status = qs('[data-player-status]', frame);
            var url = frame.getAttribute('data-video-url');
            var initialized = false;
            var hlsInstance = null;

            function setStatus(message) {
                if (status) {
                    status.textContent = message;
                }
            }

            function attachAndPlay() {
                if (!video || !url) {
                    setStatus('当前影片暂无可用播放源');
                    return;
                }
                if (!initialized) {
                    if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    } else if (window.Hls && window.Hls.isSupported()) {
                        hlsInstance = new window.Hls({
                            enableWorker: true,
                            lowLatencyMode: true
                        });
                        hlsInstance.loadSource(url);
                        hlsInstance.attachMedia(video);
                    } else {
                        setStatus('当前浏览器暂不支持 HLS 播放，请更换浏览器尝试。');
                        return;
                    }
                    initialized = true;
                }
                if (button) {
                    button.classList.add('hidden');
                }
                setStatus('正在加载播放源…');
                var playPromise = video.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise.then(function () {
                        setStatus('正在播放');
                    }).catch(function () {
                        setStatus('播放已准备好，请再次点击视频播放。');
                    });
                }
            }

            if (button) {
                button.addEventListener('click', attachAndPlay);
            }
            if (video) {
                video.addEventListener('playing', function () {
                    setStatus('正在播放');
                });
                video.addEventListener('pause', function () {
                    setStatus('已暂停');
                });
                video.addEventListener('error', function () {
                    setStatus('播放源加载失败，请稍后重试。');
                });
            }
            window.addEventListener('beforeunload', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initNavigation();
        initHero();
        initLocalFilters();
        initGlobalSearch();
        initPlayers();
    });
}());
