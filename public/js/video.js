var videoInterval = new Object();
var videoTimeout = new Object();
var browserPrefixes = ['', 'moz', 'webkit', 'ms']
var template = `<div class="panel play paused">
                  <div class="panel-video-name"></div>
                  <div class="panel-play-icon">
                    <i class="fas fa-play"></i>
                  </div>
                </div>
                <div class="video-control">
                  <div class="video-time">
                    <span class="current-time"></span>
                    <span class="duration-time"></span>
                  </div>
                  <div class="progress duration">
                    <div class="progress-bar"></div>
                  </div>
                  <div class="actions">
                    <div class="left-actions">
                      <div class="btn-action play paused"></div>
                      <div class="btn-action forward"></div>
                      <div class="btn-action volume">
                        <span class="volume-icon"></span>
                        <div class="progress volume-duration">
                          <div class="progress-bar"></div>
                        </div>
                      </div>
                    </div>
                    <div class="right-actions">
                      <div class="btn-action subtitle"></div>
                      <div class="btn-action expand"></div>
                    </div>
                  </div>
                </div>`;

window.addEventListener('DOMContentLoaded', function() {
  elementsByClass('simple-video').forEach((simpleVideo, index) => {
    var parent = simpleVideo.parentElement;
    var videoContainer = document.createElement('div')
    var videoWrapper = document.createElement('div');
    var cloneVideo = simpleVideo.cloneNode(true);

    cloneVideo.dataset.id = new Date().getTime() + '-' + index;

    videoContainer.classList.add('video');
    videoContainer.innerHTML = template;
    videoContainer.prepend(cloneVideo);

    videoWrapper.classList.add('video-wrapper');
    videoWrapper.appendChild(videoContainer);

    parent.replaceChild(videoWrapper, simpleVideo);
  });
}, true);

window.onload = function() {
  elementsByClass('video-wrapper').forEach(videoWrapper => {
    var videoContainer = videoWrapper.querySelector('.video');
    var panel = videoContainer.querySelector('.panel');
    var video = videoContainer.querySelector('video');
    var progress = videoContainer.querySelector('.duration');
    var volume = videoContainer.querySelector('.volume');
    var volumeDuration = volume.querySelector('.volume-duration');
    var expandButton = videoContainer.querySelector('.expand');
    var subtitleButton = videoContainer.querySelector('.subtitle');
    var videoControl = videoContainer.querySelector('.video-control');

    videoWrapper.addEventListener('mousemove', function() {
      if(video.paused) return;
      clearVideoTimeout(video);
      setVideoTimeout(video);
    });
    
    videoWrapper.addEventListener('mouseover', function() {
      if(video.paused) return;
      clearVideoTimeout(video);
      setVideoTimeout(video);
    });
    
    videoWrapper.addEventListener('mouseout', function() {
      clearVideoTimeout(video);
      if(video.paused) return;
      clearVideoTimeout(video);
      setVideoTimeout(video, 1000);
    });

    video.addEventListener('loadeddata', function() {
      var durationTime = videoContainer.querySelector('.duration-time');
      durationTime.innerHTML = timeConvert(this.duration);
      displayCurrentTime(this);
      displayCurrentVolume(this);
    });
  
    video.addEventListener('ended', function() {
      togglePlayButton(this);
      clearVideoInterval(this);
      clearVideoTimeout(this);
      video.currentTime = 0;
      progress.dataset.duration = 0;
      progress.querySelector('.progress-bar').style.width = '0%';
      panel.classList.add('show');
      videoControl.classList.remove('show');
    });
  
    video.addEventListener('play', function() {
      togglePlayButton(this);
      clearVideoInterval(this);
      setVideoInterval(this);
      setVideoTimeout(this);
    });
  
    video.addEventListener('pause', function() {
      togglePlayButton(this);
      clearVideoInterval(this);
      clearVideoTimeout(this);
      panel.classList.add('show');
      videoControl.classList.add('show');
    });
  
    video.addEventListener('timeupdate', function() {
      displayCurrentTime(this);
      if(progress.dataset.duration) return;
      setVideoInterval(this);
    });
  
    progress.addEventListener('mousedown', function(event) {
      displayCurrentOffset(this, event);
      playVideoAtDuration(this);
    });

    volume.querySelector('.volume-icon').addEventListener('click', function() {
      var currentVolume = volume.querySelector('.progress-bar');
      var previousVolume = volumeDuration.dataset.previousVolume || 1;
  
      volume.classList.toggle('muted');
      video.volume = volume.classList.contains('muted') ? 0 : previousVolume;
      currentVolume.style.width = video.volume * 100 + '%';
    })
  
    volumeDuration.addEventListener('mousedown', function() {
      displayCurrentOffset(this, event);
      changeVideoVolume(this);
    });
  
    expandButton.addEventListener('click', function() {
      isFullScreen() ? closeFullScreen() : requestFullScreen(videoWrapper);
    });

    subtitleButton.addEventListener('click', function() {
      var textTrack = video.textTracks[0];

      if(textTrack) {
        if(textTrack.mode == 'disabled' || textTrack.mode == 'hidden') {
          textTrack.mode = 'showing';
          this.classList.add('active');
        } else {
          textTrack.mode = 'disabled';
          this.classList.remove('active');
        }
      }
    });

    panel.addEventListener('dblclick', function() {
      expandButton.click();
    });
  });

  elementsByClass('play').forEach(playButton => {
    playButton.addEventListener('click', function () {
      var video = getCurrentVideo(this);
      video.paused ? video.play() : video.pause();
      togglePlayButton(video);
    });
  });
}

browserPrefixes.forEach(prefix => {
  document.addEventListener(prefix + 'fullscreenchange', function () {
    var videoWrapper = this.querySelector('.video-wrapper');
    videoWrapper && videoWrapper.classList.toggle('expanded');
  });
});

document.addEventListener('fullscreenchange', function () {
  var videoWrapper = this.querySelector('.video-wrapper.expanded');
  videoWrapper && videoWrapper.classList.toggle('expanded');
});

window.addEventListener('mouseup', function () {
  var progresses = elementsByClass('progress');
  var volume = progresses.find(elem => elem.classList.contains('active'));
  setPreviousVolume(volume);
  inactiveAllProgress(progresses);
});

window.addEventListener('mousemove', function(event) {
  var progresses = elementsByClass('progress');
  var progress = progresses.find(elem => elem.classList.contains('active'));
  if (event.which != 1) inactiveAllProgress(progresses);
  if (progress) {
    displayCurrentOffset(progress, event);
    playVideoAtDuration(progress);
    changeVideoVolume(progress);
  }
});

function inactiveAllProgress(progresses) {
  progresses.forEach(elem => elem.classList.remove('active'));
}

function togglePlayButton(video) {
  var playButtons = Array.from(video.closest('.video')
    .getElementsByClassName('play'))
  
  playButtons.forEach(btnPlay => {
    if(video.paused) {
      btnPlay.classList.add('paused')
    } else {
      btnPlay.classList.remove('paused')
    } 
  });
}

function displayCurrentOffset(progress, event) {
  var progressBar = progress.querySelector('.progress-bar');
  var offsetX = getCurrentOffset(progress, event);

  event.preventDefault();
  progress.classList.add('active');
  progress.dataset.duration = offsetX;
  progressBar.style.width = offsetX + '%';
}

function getCurrentOffset(progress, event) {
  var position = progress.getBoundingClientRect();
  var offsetX = (event.clientX - position.x) * 100 / position.width;
  return Math.min(Math.max(0, offsetX), 100);
}

function displayCurrentTime(video) {
  var currentTime = video.closest('.video').querySelector('.current-time');
  currentTime.innerHTML = timeConvert(video.currentTime);
}

function playVideoAtDuration(progress) {
  if(!progress.classList.contains('duration')) return;
  var video = getCurrentVideo(progress);
  var currentTime = progress.dataset.duration * video.duration / 100;
  video.currentTime = currentTime;
}

function setPreviousVolume(volume) {
  if(!volume || !volume.classList.contains('volume-duration')) return;
  var video = getCurrentVideo(volume);
  if(video.volume) volume.dataset.previousVolume = video.volume;
}

function displayCurrentVolume(video) {
  var volume = video.closest('.video').querySelector('.volume');
  var currentVolume = volume.querySelector('.volume-duration .progress-bar');
  currentVolume.style.width = video.volume * 100 + '%';
  video.volume ? volume.classList.remove('muted') : volume.classList.add('muted');
}

function changeVideoVolume(volumeDuration) {
  if(!volumeDuration.classList.contains('volume-duration')) return;
  var video = getCurrentVideo(volumeDuration);
  var volume = volumeDuration.closest('.volume');
  var volumeValue = volumeDuration.dataset.duration / 100;
  volumeValue = isNaN(volumeValue) ? 1 : volumeValue;
  volumeValue ? volume.classList.remove('muted') : volume.classList.add('muted');
  video.volume = volumeValue;
}

function getCurrentVideo(elem) {
  return elem.closest('.video').querySelector('video');
}

function setVideoInterval(video) {
  if(video.dataset.intervalId) {
    clearVideoInterval(video);
  } else {
    var progress = video.closest('.video').querySelector('.duration');
    var progressBar = progress.querySelector('.progress-bar');
    var interval = setInterval(function() {
      var currentDuration = video.currentTime / video.duration * 100;
      progressBar.style.width = currentDuration + '%';
      progress.dataset.duration = currentDuration;
    }, 50);
    videoInterval[video.dataset.id] = interval;
  }
}

function setVideoTimeout(video, time = 3000) {
  var videoContainer = video.closest('.video');
  var panel = videoContainer.querySelector('.panel');
  var videoControl = videoContainer.querySelector('.video-control');
  var timeout = setTimeout(function() {
    panel.classList.remove('show');
    videoControl.classList.remove('show');
  }, time);

  panel.classList.add('show');
  videoControl.classList.add('show');

  clearVideoTimeout(video);
  videoTimeout[video.dataset.id] = timeout;
}

function clearVideoTimeout(video) {
  var timeout = videoTimeout[video.dataset.id];
  timeout && clearTimeout(timeout);
}

function clearVideoInterval(video) {
  var interval = videoInterval[video.dataset.id];
  interval && clearInterval(interval);
}

function elementsByClass(className) {
  return Array.from(document.getElementsByClassName(className))
}

function isFullScreen() {
  return window.innerHeight == screen.height;
}

function requestFullScreen(videoWrapper) {
  var fullcreen = (
    videoWrapper.requestFullscreen ||
    videoWrapper.msRequestFullscreen ||
    videoWrapper.mozRequestFullScreen ||
    videoWrapper.webkitRequestFullscreen
  );
  fullcreen.call(videoWrapper);
}

function closeFullScreen() {
  var closescreen = (
    document.exitFullscreen ||
    document.msExitFullscreen ||
    document.mozCancelFullScreen ||
    document.webkitExitFullscreen
  );
  closescreen.call(document);
}

function timeConvert(time) { 
  var seconds = Math.round(time % 60);
  var minutes = Math.floor(time / 60) % 60;
  var hours = Math.floor(time / 3600);

  minutes = minutes < 10 ? `0${minutes}` : minutes;
  seconds = seconds < 10 ? `0${seconds}` : seconds;

  if(hours) {
    hours = hours < 10 ? `0${hours}` : hours;
    return `${hours}:${minutes}:${seconds}`;
  } else {
    return `${minutes}:${seconds}`;
  }
}
