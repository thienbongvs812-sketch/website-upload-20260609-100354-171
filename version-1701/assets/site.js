(function () {
    function selectAll(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function bindMobileMenu() {
        var button = document.querySelector(".mobile-toggle");
        var panel = document.querySelector(".mobile-panel");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            var willOpen = panel.hasAttribute("hidden");
            if (willOpen) {
                panel.removeAttribute("hidden");
            } else {
                panel.setAttribute("hidden", "");
            }
            button.setAttribute("aria-expanded", String(willOpen));
        });
    }

    function bindHero() {
        var hero = document.querySelector(".hero");
        if (!hero) {
            return;
        }
        var slides = selectAll(".hero-slide", hero);
        var dots = selectAll(".hero-dot", hero);
        var prev = hero.querySelector(".hero-prev");
        var next = hero.querySelector(".hero-next");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === index);
            });
        }

        function schedule() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                schedule();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                schedule();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                schedule();
            });
        }

        show(0);
        schedule();
    }

    function bindLocalFilters() {
        selectAll(".category-filter-input").forEach(function (input) {
            var root = input.closest("main") || document;
            var cards = selectAll("[data-search]", root);
            var empty = root.querySelector(".empty-state");

            function apply() {
                var query = input.value.trim().toLowerCase();
                var visible = 0;
                cards.forEach(function (card) {
                    var text = (card.getAttribute("data-search") || card.textContent || "").toLowerCase();
                    var matched = !query || text.indexOf(query) !== -1;
                    card.hidden = !matched;
                    if (matched) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            input.addEventListener("input", apply);
            apply();
        });
    }

    function buildSearchCard(movie) {
        var article = document.createElement("article");
        article.className = "movie-card compact-card";
        article.innerHTML = [
            '<a class="poster-link" href="./' + movie.file + '" aria-label="' + escapeHtml(movie.title) + '">',
            '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '海报" loading="lazy">',
            '<span class="type-badge">' + escapeHtml(movie.type) + '</span>',
            '</a>',
            '<div class="card-body">',
            '<a href="./' + movie.file + '" class="card-title">' + escapeHtml(movie.title) + '</a>',
            '<p>' + escapeHtml(movie.oneLine) + '</p>',
            '<div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span></div>',
            '</div>'
        ].join("");
        return article;
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function bindSearchPage() {
        var results = document.getElementById("searchResults");
        if (!results || !window.SITE_MOVIES) {
            return;
        }
        var input = document.getElementById("searchPageInput");
        var empty = document.getElementById("searchEmpty");
        var title = document.getElementById("searchTitle");
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        if (input) {
            input.value = query;
        }
        query = query.trim().toLowerCase();
        results.innerHTML = "";
        if (!query) {
            if (empty) {
                empty.hidden = false;
            }
            return;
        }
        var matched = window.SITE_MOVIES.filter(function (movie) {
            return movie.search.indexOf(query) !== -1;
        }).slice(0, 180);
        if (title) {
            title.textContent = "“" + params.get("q") + "”的搜索结果";
        }
        matched.forEach(function (movie) {
            results.appendChild(buildSearchCard(movie));
        });
        if (empty) {
            empty.textContent = matched.length ? "" : "没有找到符合条件的影片。";
            empty.hidden = matched.length !== 0;
        }
    }

    window.initMoviePlayer = function (videoId, buttonId, messageId, videoUrl) {
        var video = document.getElementById(videoId);
        var button = document.getElementById(buttonId);
        var message = document.getElementById(messageId);
        var hls = null;
        var loaded = false;

        if (!video || !button || !videoUrl) {
            return;
        }

        function showMessage() {
            if (message) {
                message.hidden = false;
            }
        }

        function attach() {
            if (loaded) {
                return;
            }
            loaded = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = videoUrl;
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hls.loadSource(videoUrl);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        showMessage();
                    }
                });
                return;
            }
            video.src = videoUrl;
        }

        function play() {
            attach();
            button.hidden = true;
            video.controls = true;
            var request = video.play();
            if (request && typeof request.catch === "function") {
                request.catch(function () {
                    button.hidden = false;
                });
            }
        }

        button.addEventListener("click", play);
        video.addEventListener("click", function () {
            if (video.paused) {
                play();
            }
        });
        video.addEventListener("error", showMessage);
        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };

    document.addEventListener("DOMContentLoaded", function () {
        bindMobileMenu();
        bindHero();
        bindLocalFilters();
        bindSearchPage();
    });
}());
