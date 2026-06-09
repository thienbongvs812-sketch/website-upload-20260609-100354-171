(function () {
  "use strict";

  function setupPlayer(player) {
    var video = player.querySelector("video");
    var overlay = player.querySelector(".play-overlay");
    var status = player.querySelector("[data-player-status]");
    var source = player.getAttribute("data-src");
    var initialized = false;
    var hlsInstance = null;

    if (!video || !source) {
      if (status) {
        status.textContent = "播放源未配置";
      }
      return;
    }

    function setStatus(text) {
      if (status) {
        status.textContent = text;
      }
    }

    function initSource() {
      if (initialized) {
        return;
      }
      initialized = true;
      setStatus("正在初始化 HLS 播放源…");

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        setStatus("已启用浏览器原生 HLS 播放");
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus("HLS 播放源加载完成，可开始播放");
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
          if (data && data.fatal) {
            setStatus("播放遇到问题，正在尝试恢复…");
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hlsInstance.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hlsInstance.recoverMediaError();
            } else {
              hlsInstance.destroy();
            }
          }
        });
        return;
      }

      video.src = source;
      setStatus("当前浏览器不支持 HLS.js，已尝试直接加载播放源");
    }

    function startPlayback() {
      initSource();
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          setStatus("浏览器阻止了自动播放，请再次点击视频区域或使用控制栏播放");
        });
      }
    }

    if (overlay) {
      overlay.addEventListener("click", startPlayback);
    }

    video.addEventListener("click", initSource, { once: true });
    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      setStatus("正在播放");
    });
    video.addEventListener("pause", function () {
      setStatus("已暂停");
    });
    video.addEventListener("waiting", function () {
      setStatus("正在缓冲…");
    });
    video.addEventListener("error", function () {
      setStatus("播放器加载失败，请检查网络或播放源可用性");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.slice.call(document.querySelectorAll("[data-player]")).forEach(setupPlayer);
  });
})();
