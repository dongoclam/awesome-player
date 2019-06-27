$(document).on('click', '.btn-get-subtitle', function() {
  var $video = currentVideo();
  var fullPath = $video.attr('fullpath');
  var video = videoFiles().find(video => video.fullPath == fullPath);

  if(video) transcriptVideo(video);
});

function transcriptVideo(video) {
  var data = new FormData();
  data.append('sourceFile', video);

  $.ajax({
    url: '/transcriptions',
    method: 'POST',
    data: data,
    contentType: false,
    processData: false,
    timeout: 15 * 60 * 1000,
    success: function(response) {
      console.log(response);
    }
  });
}
