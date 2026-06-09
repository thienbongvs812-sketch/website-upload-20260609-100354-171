(function () {
  "use strict";

  function rootPrefix() {
    return document.body.getAttribute("data-root") || "";
  }

  function bySelector(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupMobileMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function setupSearchForms() {
    bySelector(".site-search-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var query = input ? input.value.trim() : "";
        var target = rootPrefix() + "search.html";
        if (query) {
          target += "?q=" + encodeURIComponent(query);
        }
        window.location.href = target;
      });
    });
  }

  function setupHeroCarousel() {
    var hero = document.querySelector("[data-hero-carousel]");
    if (!hero) {
      return;
    }

    var slides = bySelector(".hero-slide", hero);
    var dots = bySelector(".hero-dot", hero);
    if (slides.length <= 1) {
      return;
    }

    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
        dot.setAttribute("aria-selected", dotIndex === index ? "true" : "false");
      });
    }

    function play() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        play();
      });
    });

    hero.addEventListener("mouseenter", function () {
      window.clearInterval(timer);
    });

    hero.addEventListener("mouseleave", play);
    show(0);
    play();
  }

  function setupCurrentPageFilter() {
    var filter = document.querySelector("[data-card-filter]");
    if (!filter) {
      return;
    }

    var cards = bySelector(".movie-card[data-search]");
    var counter = document.querySelector("[data-filter-count]");

    function runFilter() {
      var query = filter.value.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var text = (card.getAttribute("data-search") || "").toLowerCase();
        var matched = !query || text.indexOf(query) !== -1;
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });
      if (counter) {
        counter.textContent = "当前显示 " + visible + " 部";
      }
    }

    filter.addEventListener("input", runFilter);
    runFilter();
  }

  function movieCardHtml(item) {
    var root = rootPrefix();
    var tags = (item.tags || []).slice(0, 3).map(function (tag) {
      return "<span class=\"movie-tag\">" + escapeHtml(tag) + "</span>";
    }).join("");

    return [
      "<article class=\"movie-card\" data-search=\"" + escapeHtml(item.searchText || "") + "\">",
      "  <a class=\"poster-link\" href=\"" + root + escapeHtml(item.href) + "\">",
      "    <img loading=\"lazy\" src=\"" + root + escapeHtml(item.cover) + "\" alt=\"" + escapeHtml(item.title) + "\">",
      "    <span class=\"poster-badge\">" + escapeHtml(item.category) + "</span>",
      "    <span class=\"poster-score\">" + escapeHtml(item.score) + "</span>",
      "    <span class=\"poster-play\">▶</span>",
      "  </a>",
      "  <div class=\"movie-card-body\">",
      "    <h3 class=\"movie-title\"><a href=\"" + root + escapeHtml(item.href) + "\">" + escapeHtml(item.title) + "</a></h3>",
      "    <div class=\"movie-meta\"><span>" + escapeHtml(item.year) + "</span><span>" + escapeHtml(item.region) + "</span><span>" + escapeHtml(item.type) + "</span></div>",
      "    <p class=\"movie-one-line\">" + escapeHtml(item.oneLine) + "</p>",
      "    <div class=\"movie-tags\">" + tags + "</div>",
      "  </div>",
      "</article>"
    ].join("\n");
  }

  function setupSearchPage() {
    var results = document.querySelector("[data-search-results]");
    if (!results || !window.MOVIE_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var input = document.querySelector("[data-search-input]");
    var category = document.querySelector("[data-search-category]");
    var year = document.querySelector("[data-search-year]");
    var type = document.querySelector("[data-search-type]");
    var sort = document.querySelector("[data-search-sort]");
    var count = document.querySelector("[data-search-count]");

    if (input) {
      input.value = params.get("q") || "";
    }

    function filteredItems() {
      var query = input ? input.value.trim().toLowerCase() : "";
      var cat = category ? category.value : "";
      var selectedYear = year ? year.value : "";
      var selectedType = type ? type.value : "";
      var items = window.MOVIE_INDEX.filter(function (item) {
        var ok = true;
        if (query) {
          ok = ok && (item.searchText || "").toLowerCase().indexOf(query) !== -1;
        }
        if (cat) {
          ok = ok && item.categories.indexOf(cat) !== -1;
        }
        if (selectedYear) {
          ok = ok && String(item.year) === selectedYear;
        }
        if (selectedType) {
          ok = ok && String(item.type).indexOf(selectedType) !== -1;
        }
        return ok;
      });

      var sortBy = sort ? sort.value : "views";
      items.sort(function (a, b) {
        if (sortBy === "year") {
          return Number(b.year) - Number(a.year) || b.views - a.views;
        }
        if (sortBy === "score") {
          return Number(b.score) - Number(a.score) || b.views - a.views;
        }
        if (sortBy === "title") {
          return String(a.title).localeCompare(String(b.title), "zh-Hans-CN");
        }
        return b.views - a.views;
      });
      return items;
    }

    function render() {
      var items = filteredItems();
      if (count) {
        count.textContent = "共找到 " + items.length + " 部影片，已展示前 " + Math.min(items.length, 240) + " 部。";
      }
      if (!items.length) {
        results.innerHTML = "<div class=\"empty-state\"><h2>没有找到匹配影片</h2><p>可以尝试减少关键词，或切换分类、年份与类型筛选。</p></div>";
        return;
      }
      results.innerHTML = items.slice(0, 240).map(movieCardHtml).join("\n");
    }

    [input, category, year, type, sort].forEach(function (control) {
      if (control) {
        control.addEventListener("input", render);
        control.addEventListener("change", render);
      }
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileMenu();
    setupSearchForms();
    setupHeroCarousel();
    setupCurrentPageFilter();
    setupSearchPage();
  });
})();
