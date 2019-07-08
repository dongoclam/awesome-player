$(document).on('click', '.btn-get-subtitle', function(event) {
  var $this = $(this);
  var fullPath = $this.data('path');
  var currentVideo = dropzone.videoFiles.find(v => v.fullPath == fullPath);
  var $icon = $this.find('i');
  
  if(video && !$this.hasClass('loading')) {
    $this.addClass('loading');
    $icon.addClass('fas fa-spinner fa-spin');
    $icon.removeClass('fal fa-stars');
    transcriptVideo(currentVideo, $icon, $this);
  }

  event.stopPropagation();
});

function transcriptVideo(currentVideo, $icon, $button) {
  var data = new FormData();
  data.append('sourceFile', currentVideo);

  $.ajax({
    url: '/transcriptions',
    method: 'POST',
    data: data,
    contentType: false,
    processData: false,
    timeout: 15 * 60 * 1000,
    success: function(response) {
      var source = window.location.href + 'static/' + response.subtitle;
      currentVideo.subtitle = { source: source };
      $button.removeClass('loading');
      $icon.removeClass('fas fa-spinner fa-spin').addClass('fal fa-check');

      if(video.getAttribute('fullpath') == currentVideo.fullPath) {
        addSubtitleTovideo(currentVideo);
      }
    },
    error: function() {
      $button.removeClass('loading');
      $icon.removeClass('fas fa-spinner fa-spin')
        .addClass('far fa-exclamation-circle');
    }
  });
}
