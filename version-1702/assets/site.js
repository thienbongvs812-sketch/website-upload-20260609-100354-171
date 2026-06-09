(function () {
    const menuButton = document.querySelector('[data-mobile-menu-button]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', function () {
            mobileMenu.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('img[data-fallback-title]').forEach(function (image) {
        image.addEventListener('error', function () {
            const parent = image.closest('.poster-shell, .hero-media, .detail-bg');
            if (parent) {
                parent.classList.add('image-missing');
                parent.setAttribute('data-title', image.dataset.fallbackTitle || '精选剧集');
            }
            image.remove();
        }, { once: true });
    });

    document.querySelectorAll('[data-hero-carousel]').forEach(function (carousel) {
        const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
        const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
        const prev = carousel.querySelector('[data-hero-prev]');
        const next = carousel.querySelector('[data-hero-next]');
        let activeIndex = 0;
        let timer = null;

        function setActive(index) {
            if (!slides.length) {
                return;
            }
            activeIndex = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === activeIndex);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === activeIndex);
            });
        }

        function startTimer() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                setActive(activeIndex + 1);
            }, 5200);
        }

        if (prev) {
            prev.addEventListener('click', function () {
                setActive(activeIndex - 1);
                startTimer();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                setActive(activeIndex + 1);
                startTimer();
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                setActive(Number(dot.dataset.heroDot || 0));
                startTimer();
            });
        });

        setActive(0);
        startTimer();
    });

    const queryInput = document.querySelector('[data-query-input]');
    if (queryInput) {
        const urlQuery = new URLSearchParams(window.location.search).get('q');
        if (urlQuery) {
            queryInput.value = urlQuery;
        }
    }

    const searchInputs = Array.from(document.querySelectorAll('[data-filter-input]'));
    const yearButtons = Array.from(document.querySelectorAll('[data-year-filter]'));
    let activeYear = 'all';

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function applyFilters() {
        const keyword = normalize(searchInputs.map(function (input) {
            return input.value;
        }).join(' '));
        const items = Array.from(document.querySelectorAll('[data-search-item]'));
        let visibleCount = 0;

        items.forEach(function (item) {
            const text = normalize(item.dataset.searchText);
            const year = String(item.dataset.year || '');
            const keywordMatched = !keyword || text.indexOf(keyword) !== -1;
            const yearMatched = activeYear === 'all' || year === activeYear;
            const shouldShow = keywordMatched && yearMatched;
            item.classList.toggle('is-hidden', !shouldShow);
            if (shouldShow) {
                visibleCount += 1;
            }
        });

        document.querySelectorAll('[data-result-count]').forEach(function (node) {
            node.textContent = visibleCount + ' 部内容';
        });
    }

    searchInputs.forEach(function (input) {
        input.addEventListener('input', applyFilters);
    });

    yearButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            activeYear = String(button.dataset.yearFilter || 'all');
            const group = button.closest('[data-year-filter-group]') || document;
            group.querySelectorAll('[data-year-filter]').forEach(function (peer) {
                peer.classList.toggle('is-active', peer === button);
            });
            applyFilters();
        });
    });

    if (searchInputs.length || yearButtons.length) {
        applyFilters();
    }
})();
