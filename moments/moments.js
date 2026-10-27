// Keep visitor-controlled clips from talking over one another.
(() => {
  const videos = Array.from(document.querySelectorAll('.moments video'));
  videos.forEach(video => video.addEventListener('play', () => {
    videos.forEach(other => { if (other !== video) other.pause(); });
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach(video => video.pause());
  });
})();
