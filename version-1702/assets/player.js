import { H as Hls } from './hls-vendor-dru42stk.js';

function setStatus(container, message) {
    const status = container.querySelector('[data-player-status]');
    if (status) {
        status.textContent = message;
    }
}

document.querySelectorAll('[data-player]').forEach(function (container) {
    const video = container.querySelector('video[data-src]');
    const startButton = container.querySelector('[data-player-start]');
    const source = video ? video.dataset.src : '';
    let hls = null;
    let initialized = false;

    function initializePlayer() {
        if (!video || !source || initialized) {
            return;
        }

        initialized = true;
        setStatus(container, '正在加载播放源...');

        if (Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                video.controls = true;
                setStatus(container, '播放源已就绪');
            });
            hls.on(Hls.Events.ERROR, function (event, data) {
                if (!data || !data.fatal) {
                    return;
                }
                setStatus(container, '视频加载遇到问题，正在尝试恢复...');
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    hls.startLoad();
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                } else {
                    hls.destroy();
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            video.controls = true;
            setStatus(container, '播放源已就绪');
        } else {
            setStatus(container, '当前浏览器暂不支持 HLS 播放');
        }
    }

    function playVideo() {
        initializePlayer();
        if (!video) {
            return;
        }
        video.play().then(function () {
            container.classList.add('is-playing');
        }).catch(function () {
            setStatus(container, '请再次点击播放');
        });
    }

    if (startButton) {
        startButton.addEventListener('click', playVideo);
    }

    if (video) {
        video.addEventListener('click', function () {
            if (video.paused) {
                playVideo();
            } else {
                video.pause();
            }
        });
        video.addEventListener('pause', function () {
            container.classList.remove('is-playing');
        });
        video.addEventListener('play', function () {
            container.classList.add('is-playing');
        });
    }

    window.addEventListener('beforeunload', function () {
        if (hls) {
            hls.destroy();
        }
    });
});
