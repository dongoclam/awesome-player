var videoRegex = /video\/*/;
var fileExtensionRegex = /\.[^/.]+$/;
var scrollbar, dropzone;

$(document).ready(function() {
  $video = $('#video');
  $mainView = $('#main-view');
  $loading = $('#loading');
  $dropzone = $('#dropzone');
  $videoContainer = $('#video-container');
  $playlistContainer = $('#playlist-container');
  $playlistToggle = $('#playlist-toggle');
  $selectFile = $('#select-file');
  $playlistScroll = $('#video-playlist-scroll');

  video = $video.get(0);

  dropzone = new Dropzone('#dropzone', {
    url: '/',
    autoProcessQueue: false
  });

  dropzone.on('drop', function() {
    dropzone.files = [];
  });

  dropzone.on('addedfile', function(file) {
    if (!file.fullPath) file.fullPath = file.name;
    file.source = URL.createObjectURL(file);
    $dropzone.hide();
    $loading.show();
    $('.dz-preview').remove();
  });

  dropzone.on('addedfiles', function() {
    setTimeout(function() {
      dropzone.videoFiles = videoFiles().map(file => {
        file.subtitle = getVideoSubtitle(file.fullPath)
        return file;
      });

      if(dropzone.videoFiles.length) {
        renderTreeFile();
        autoLoadVideo();
        initScrollbar();
      }
    }, 500);
  });

  video.addEventListener('loadeddata', function() {
    var fullPath = this.getAttribute('fullpath');
    var currentVideo = dropzone.videoFiles.find(v => v.fullPath == fullPath);
    var videoName = getFileName(currentVideo.name);

    $mainView.addClass('open');
    $mainView.find('.panel-video-name').html(videoName);
  });
});

$(document).on('click', '.dropzone-panel', function() {
  $dropzone.click();
});

$(document).on('click', '.btn-back', function() {
  video.pause();
  $loading.hide();
  $dropzone.show();
  $mainView.toggleClass('open');
  $selectFile.toggleClass('open');
  $selectFile.find('.btn-back').removeClass('d-none');
});

$(document).on('click', '#toggle-dropzone', function(event) {
  $mainView.toggleClass('open');
  event.stopPropagation();
});

$(document).on('click', '#playlist-toggle', function(event) {
  $playlistToggle.toggleClass('open');
  $playlistContainer.toggleClass('open');
  $video.toggleClass('blured');
  event.stopPropagation();
});

$(document).on('click', '#playlist-container', function(event) {
  if(event.target == this && $playlistContainer.hasClass('open')) {
    $playlistToggle.click();
  }
})

$(document).on('click', '#video-playlist-scroll .tree li', function(event) {
  var path = $(this).data('path');
  playVideo(path);
});

$(document).on('click', '#video-container', function(event) {
  if(event.target == this) {
    video.pause();
    $playlistContainer.removeClass('blured');
    $(this).removeClass('open');
  }
});

$(document).on('click', '.remove', function() {
  var $this = $(this);
  var $treeLink = $this.siblings('.tree-link');
  var path = $treeLink.data('path');
  var index = dropzone.files.findIndex(file => file.fullPath == path);
  dropzone.files.splice(index, 1);
  renderTreeFile();
  initScrollbar();
  activeCurrentVideoLink();
});

$(document).on('click', '.video .forward', function() {
  var path = $video.attr('fullpath');
  var index = dropzone.videoFiles.findIndex(file => file.fullPath == path);
  var nextIndex = index == dropzone.videoFiles.length - 1 ? 0 : index + 1;
  var nextPath = dropzone.videoFiles[nextIndex].fullPath;
  playVideo(nextPath);
});

window.onresize = setPlaylistHeight;
window.onmousemove = setPlaylistHeight;
window.onmouseenter = setPlaylistHeight;
window.onmouseover = setPlaylistHeight;

function autoLoadVideo() {
  var firstVideo = dropzone.videoFiles[0];

  $selectFile.toggleClass('open');
  $mainView.toggleClass('open');

  if(firstVideo) playVideo(firstVideo.fullPath, false);
}

function playVideo(path, play=true) {
  var videoFile = dropzone.files.find(file => file.fullPath == path);

  $video.attr('fullpath', path);
  video.src = videoFile.source;
  $videoContainer.addClass('open');

  if (play) video.play();

  addSubtitleTovideo(videoFile);
  activeCurrentVideoLink();
}

function addSubtitleTovideo(videoFile) {
  var subtitle = videoFile.subtitle && videoFile.subtitle.source;
  $video.children('track').remove();
  if (subtitle) $video.append(`<track src="${subtitle}" kind="subtitles">`);
}

function activeCurrentVideoLink() {
  var path = $video.attr('fullpath');
  var $linkWithPath = $(`li[data-path="${path}"]`);
  $('.tree li').removeClass('active');
  $linkWithPath.addClass('active');
}

function initScrollbar() {
  setPlaylistHeight();
  
  scrollbar = Scrollbar.init($playlistScroll.get(0), {
    continuousScrolling: false,
    alwaysShowTracks: false
  });
}

function setPlaylistHeight() {
  var videoContainerHeight = $videoContainer.height();

  if(videoContainerHeight) {
    $playlistScroll.css('height', videoContainerHeight - 30 + 'px');
  }
}

function videoFiles() {
  return dropzone.files.filter(file => videoRegex.test(file.type))
    .sort((a, b) => (a.name > b.name ? 1 : -1));
}

function getVideoSubtitle(path) {
  var filename = getFileName(path);

  return dropzone.files.find(file => {
    return file.fullPath != path && getFileName(file.fullPath) == filename;
  });
}

function renderTreeFile() {
  var filePaths = dropzone.videoFiles.map(file => file.fullPath);
  var treeList = loadTreeList(filePaths);
  var treeFiles = loadTreeFiles(treeList);
  var sortedTreeFiles = sortTreeFiles(treeFiles);
  if(scrollbar) scrollbar.destroy();
  $('#video-playlist-scroll').html(fileHTML(sortedTreeFiles));
  $('.playlist-count').html(dropzone.videoFiles.length);
}

function fileHTML() {
  var $partial = $('<ul class="tree"></ul>');

  dropzone.videoFiles.forEach(video => {
    var videoName = getFileName(video.name);
    var $video = $(`<video src="${video.source}"></video>`);
    var $videoPartial = $(
      `<li data-path="${video.fullPath}">
        <span class="video-name text-truncate">${videoName}</span>
        <button data-path="${video.fullPath}" class="btn btn-get-subtitle">
          <i class="fal fa-stars"></i>Subtitle
        </button>
      </li>`
    );

    $video.get(0).addEventListener('loadeddata', function() {
      var videoDuration = timeConvert(this.duration);
      var $videoTime = $(`<span class="video-time">${videoDuration}</span>`);
      var $videoName = $(this).next('.video-name');
      $videoTime.insertAfter($videoName);
    });

    $videoPartial.prepend($video);
    $partial.append($videoPartial);
  });

  return $partial;
}

function treeFileHTML(treeFiles) {
  var $partial = $('<ul class="tree"></ul>');

  treeFiles.forEach(tree => {
    if (tree.path) {
      var $treeTitle = $(
        `<li>
          <a class="tree-link" data-path="${tree.path}">${tree.text}</a>
          <span class="remove"><i class="fal fa-times"></i></span>
        </li>`
      );
    } else {
      var $treeTitle = $(`<li><a class="tree-title">${tree.text}</a></li>`);
    }
    if (tree.nodes) $treeTitle.append(treeFileHTML(tree.nodes));
    $partial.append($treeTitle);
  });

  return $partial;
}

function sortTreeFiles(treeFiles) {
  treeFiles.sort((a, b) => {
    if (a.nodes && !b.nodes) {
      return -1;
    } else if (!a.nodes && b.nodes) {
      return 1;
    } else {
      return a.text > b.text ? 1 : -1;
    }
  });

  treeFiles.forEach(tree => {
    if (tree.nodes) sortTreeFiles(tree.nodes);
  });

  return treeFiles;
}

function loadTreeFiles(arrFile, result = []) {
  arrFile.forEach(subArrFile => {
    var sameLevelTree = result.find(element => {
      return element.text == subArrFile.text;
    });

    if (sameLevelTree && sameLevelTree.nodes && subArrFile.nodes) {
      sameLevelTree.nodes = loadTreeFiles(
        sameLevelTree.nodes,
        subArrFile.nodes
      );
    } else {
      result.push(subArrFile);
    }
  });

  return result;
}

function loadTreeList(filePaths) {
  return filePaths.map(path => {
    var splitedPath = path.split('/');
    return pathToTree(splitedPath, path);
  });
}

function pathToTree(splitedPath, path) {
  if (splitedPath.length > 1) {
    return {
      text: splitedPath.shift(),
      nodes: [pathToTree(splitedPath, path)]
    };
  } else {
    return { text: splitedPath.shift(), path: path };
  }
}

function getFileName(fileName) {
  return fileName.replace(fileExtensionRegex, "");
}
