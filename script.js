/*
 * HTML5 Custom Video Player — Vanilla JavaScript
 *
 * 구조
 *   PlayerView       : DOM 갱신(재생 상태, 시간, 볼륨, 프로그레스 바)
 *   PlayerController : 사용자의 입력 처리, Media API 제어, RAF 루프 관리
 *
 * video 요소가 재생 상태의 단일 기준(Single Source of Truth)이다.
 */

'use strict';

const video = document.getElementById('video');
const player = document.getElementById('player');

const ui = {
  play: document.getElementById('play'),
  playIcon: document.getElementById('play-icon'),
  bigPlay: document.getElementById('big-play'),
  mute: document.getElementById('mute'),
  volumeIcon: document.getElementById('volume-icon'),
  volume: document.getElementById('volume'),
  volumeLabel: document.getElementById('volume-label'),
  seek: document.getElementById('seek'),
  currentTime: document.getElementById('current-time'),
  duration: document.getElementById('duration'),
  speed: document.getElementById('speed'),
  fullscreen: document.getElementById('fullscreen'),
  status: document.getElementById('playback-status'),
  fileInput: document.getElementById('video-file'),
  videoTitle: document.getElementById('video-title'),
  fileHint: document.getElementById('file-hint')
};

const state = {
  frameId: null,
  isScrubbing: false,
  isBuffering: false,
  objectURL: null
};

function hasDuration() {
  return Number.isFinite(video.duration) && video.duration > 0;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const whole = Math.floor(seconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}

function setText(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

// View: HTMLMediaElement 상태를 읽어 모든 컨트롤을 한꺼번에 동기화한다.
function renderPlayer() {
  const playing = !video.paused && !video.ended;

  ui.play.setAttribute('aria-label', playing ? '일시정지' : '재생');
  ui.bigPlay.hidden = playing;
  // 불필요한 SVG DOM 교체를 피한다(애니메이션 중에는 매 프레임 호출됨).
  const playMode = playing ? 'pause' : 'play';
  if (ui.playIcon.dataset.mode !== playMode) {
    ui.playIcon.dataset.mode = playMode;
    ui.playIcon.innerHTML = playing
      ? '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'
      : '<path d="m9 5 10 7-10 7V5Z"/>';
  }

  if (hasDuration()) {
    ui.seek.disabled = false;
    setText(ui.duration, formatTime(video.duration));
    setText(ui.currentTime, formatTime(video.currentTime));

    if (!state.isScrubbing) {
      const value = Math.round(video.currentTime / video.duration * 1000);
      ui.seek.value = String(Math.min(1000, Math.max(0, value)));
      ui.seek.style.setProperty('--fill', `${value / 10}%`);
    }
  } else {
    ui.seek.disabled = true;
    ui.seek.value = '0';
    ui.seek.style.setProperty('--fill', '0%');
    setText(ui.currentTime, formatTime(video.currentTime));
    setText(ui.duration, '00:00');
  }

  const muted = video.muted || video.volume === 0;
  ui.mute.setAttribute('aria-label', muted ? '음소거 해제' : '음소거');
  const volumeMode = muted ? 'muted' : 'audible';
  if (ui.volumeIcon.dataset.mode !== volumeMode) {
    ui.volumeIcon.dataset.mode = volumeMode;
    ui.volumeIcon.innerHTML = muted
      ? '<path d="M11 5 6.5 9H3v6h3.5l4.5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/>'
      : '<path d="M11 5 6.5 9H3v6h3.5l4.5 4V5ZM15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/>';
  }
  ui.volume.value = String(video.volume);
  ui.volume.style.setProperty('--fill', `${video.volume * 100}%`);
  setText(ui.volumeLabel, `${Math.round(muted ? 0 : video.volume * 100)}%`);
  setText(ui.speed, `${video.playbackRate}×`);

  const status = video.error ? '재생 오류'
    : state.isBuffering ? '버퍼링 중'
    : video.ended ? '재생 완료'
    : playing ? '재생 중'
    : video.readyState > 0 ? '일시정지' : '준비 중';
  setText(ui.status, status);
  player.classList.toggle('is-buffering', state.isBuffering);
  ui.fullscreen.setAttribute('aria-label', document.fullscreenElement ? '전체 화면 종료' : '전체 화면');
}

// Controller: 실제 재생 중에만 다음 프레임을 요청한다.
function animationFrame() {
  state.frameId = null;
  renderPlayer();
  if (!video.paused && !video.ended && !document.hidden) {
    state.frameId = requestAnimationFrame(animationFrame);
  }
}

function startRenderLoop() {
  if (state.frameId === null && !video.paused && !video.ended && !document.hidden) {
    state.frameId = requestAnimationFrame(animationFrame);
  }
}

function stopRenderLoop() {
  if (state.frameId !== null) {
    cancelAnimationFrame(state.frameId);
    state.frameId = null;
  }
}

function syncPlayback() {
  if (video.paused || video.ended) stopRenderLoop();
  else startRenderLoop();
  renderPlayer();
}

async function togglePlayback() {
  if (!video.paused && !video.ended) {
    video.pause();
    return;
  }
  try {
    if (video.ended && hasDuration()) video.currentTime = 0;
    await video.play();
  } catch (error) {
    console.error('재생 실패:', error);
    setText(ui.status, '재생할 수 없음');
  }
}

function seekToSlider() {
  if (!hasDuration()) return;
  const seconds = Number(ui.seek.value) / 1000 * video.duration;
  video.currentTime = Math.min(video.duration, Math.max(0, seconds));
  ui.seek.style.setProperty('--fill', `${Number(ui.seek.value) / 10}%`);
  setText(ui.currentTime, formatTime(seconds));
}

ui.play.addEventListener('click', togglePlayback);
ui.bigPlay.addEventListener('click', togglePlayback);
video.addEventListener('click', togglePlayback);

ui.seek.addEventListener('pointerdown', () => { state.isScrubbing = true; });
ui.seek.addEventListener('input', seekToSlider); // 드래그 중에도 즉시 Seeking
ui.seek.addEventListener('change', () => {
  seekToSlider();
  state.isScrubbing = false;
  renderPlayer();
});
ui.seek.addEventListener('pointerup', () => { state.isScrubbing = false; renderPlayer(); });
ui.seek.addEventListener('pointercancel', () => { state.isScrubbing = false; renderPlayer(); });
ui.seek.addEventListener('blur', () => { state.isScrubbing = false; renderPlayer(); });

ui.volume.addEventListener('input', () => {
  video.volume = Number(ui.volume.value);
  video.muted = false;
});
ui.mute.addEventListener('click', () => { video.muted = !video.muted; });

const playbackRates = [1, 1.25, 1.5, 2, 0.75];
ui.speed.addEventListener('click', () => {
  const index = playbackRates.indexOf(video.playbackRate);
  video.playbackRate = playbackRates[(index + 1) % playbackRates.length];
});

ui.fullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (player.requestFullscreen) await player.requestFullscreen();
  } catch (error) {
    console.warn('전체 화면 전환 실패:', error);
  }
});

// 로컬 파일 선택은 업로드가 아닌 브라우저의 임시 Blob URL 생성이다.
ui.fileInput.addEventListener('change', async () => {
  const file = ui.fileInput.files?.[0];
  if (!file) return;
  if (!(file.type.startsWith('video/') || /\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(file.name))) {
    alert('동영상 파일을 선택해 주세요.');
    ui.fileInput.value = '';
    return;
  }

  stopRenderLoop();
  video.pause();
  if (state.objectURL) URL.revokeObjectURL(state.objectURL);
  state.objectURL = URL.createObjectURL(file);
  video.src = state.objectURL;
  video.load();
  state.isBuffering = false;
  setText(ui.videoTitle, file.name);
  setText(ui.fileHint, '내 컴퓨터에서 선택한 영상 · 공개 업로드되지 않음');
  renderPlayer();
  ui.fileInput.value = '';

  try { await video.play(); }
  catch (error) { console.warn('파일 자동 재생이 제한되었거나 지원하지 않는 형식:', error); }
});

// 미디어 이벤트 발생 시 HTMLMediaElement를 읽어 UI를 갱신한다.
['play', 'pause', 'ended', 'loadedmetadata', 'durationchange', 'timeupdate',
 'seeking', 'seeked', 'volumechange', 'ratechange', 'emptied', 'error']
  .forEach(eventName => video.addEventListener(eventName, syncPlayback));

video.addEventListener('waiting', () => {
  state.isBuffering = !video.paused;
  renderPlayer();
});
video.addEventListener('playing', () => {
  state.isBuffering = false;
  syncPlayback();
});
video.addEventListener('canplay', () => {
  state.isBuffering = false;
  renderPlayer();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopRenderLoop();
  else startRenderLoop();
  renderPlayer();
});
document.addEventListener('fullscreenchange', renderPlayer);
window.addEventListener('beforeunload', () => {
  stopRenderLoop();
  if (state.objectURL) URL.revokeObjectURL(state.objectURL);
});

player.addEventListener('keydown', event => {
  if (event.target.closest('button, input, select, textarea')) return;
  if (event.code === 'Space') {
    event.preventDefault();
    togglePlayback();
  } else if ((event.code === 'ArrowLeft' || event.code === 'ArrowRight') && hasDuration()) {
    event.preventDefault();
    const amount = event.code === 'ArrowLeft' ? -5 : 5;
    video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + amount));
  } else if (event.code === 'KeyM') {
    video.muted = !video.muted;
  }
});

renderPlayer();
