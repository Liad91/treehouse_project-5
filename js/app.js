(function() {
  'use-strict';

  var $loader = $('#loader');
  $loader.hide();

  $('.search-form').submit(function(e) {
    e.preventDefault();
    var $title = $('#search');
    var $year = $('#year');
    var $ul = $('#movies');
    var $submit = $('#submit');
    var $movie = $('.movie-wrap');
    var output = '';
    var error = '';
    var pages;
    var omdbAPI = 'http://www.omdbapi.com/';
    var data = {
      s : $title.val(),
      y : $year.val(),
      page : 1,
      type : 'movie'
    };
    // Remove movie page
    if ($movie) {
      $movie.remove();
      $ul.show();
    }
    // If no title, display error and prevent submit
    if (!$title.val()) {
      $year.css('border-bottom-color', '#e4e4e4');
      error += 'Please enter a title';
      errMsg(error);
      $title.css('border-bottom-color', 'red');
      $title.focus();
      return false;
    } else {
      // If year is not between 1900 - today, display error and prevent submit
      var date = new Date();
      var currentYear = date.getFullYear();
      $title.css('border-bottom-color', '#e4e4e4');
      if ($year.val()) {
        if ($year.val().length !== 4 || parseInt($year.val()) < 1900 || parseInt($year.val()) > currentYear ) {
          error += 'Please enter a valid year (1900 - Current year)';
          errMsg(error);
          $year.css('border-bottom-color', 'red');
          $year.focus();
          return false;
        }
      }
    }
    $('#more-wrap').remove();
    $title.css('border-bottom-color', '#e4e4e4');
    $year.css('border-bottom-color', '#e4e4e4');
    $submit.prop('disabled', true);
    $ul.hide();
    $loader.show();
    $.ajax({
      url : omdbAPI,
      data : data,
      success : submitCallback,
      dataType : 'json',
      complete : submitComplete
    });
    
    function submitCallback(response) {
      if (response.Response !== 'False') {
        // Calculate number of pages for more loader
        if (response.totalResults % 10 === 0) {
          pages = response.totalResults / 10;
        } else {
          pages = Math.floor(response.totalResults / 10) + 1;
        }
        // Build list item (li) for each result
        $.each(response.Search, function(i, movie) {
          output += '<li>';
          output += '<a href="#" class="full-details">';
          output += '<div class="poster-wrap">';
          if (movie.Poster !== 'N/A') {
            output += '<img class="movie-poster"';
            output += 'src="' + movie.Poster + '">';
          } else {
            output += '<i class="material-icons poster-placeholder">crop_original</i>';
          }
          output += '</div>';
          output += '<span class="movie-title">' + movie.Title + '</span>';
          output += '<span class="movie-year">' + movie.Year + '</span>';
          output += '</a></li>';
        });
        $loader.hide();
        if ($('#more-wrap')) {
          $('#more-wrap').remove();
        }
        var html = '<div class="main-content" id="more-wrap">';
        html += '<a href="#" id="more" class="btn">Load More</a>';
        html += '</div>';
        $ul.show().html(output);
        $('.main-content').after(html);
      } else {
        // If no result display error message
        error += 'No movies found that match: <strong>' + $title.val() + '</strong>';
        if ($year.val()) {
          error += ' from: <strong>' + $year.val() + '</strong>';
        }
        errMsg(error);
      }
      $submit.prop('disabled', false);
    }

    function errMsg(msg) {
      var html = '<li class="no-movies">';
      html += '<i class="material-icons icon-help">help_outline</i>';
      html += msg;
      html += '</li>';
      $loader.hide();
      $ul.show().html(html);
    }

    function submitComplete() {
      var $moreWrap = $('#more-wrap');
      // More loader increase page by 1 and sends a new request 
      $('#more').click(function(e) {
        e.preventDefault();
        $moreWrap.html('<img src="img/ajax.gif">');
        if (pages > data.page) {
          data.page += 1;
          $.ajax({
            url : omdbAPI,
            data : data,
            success : submitCallback,
            dataType : 'json',
            complete : submitComplete
          });
        } else {
          // If no more pages display message
          $moreWrap.html('<h2>No More Results!</h2>');
        }
      });
      // Send a new request for each list item (li)
      $('.full-details').click(function(e) {
        e.preventDefault();
        $loader.show()
        $ul.hide();
        $moreWrap.hide();
        var movieTitle = $(this).children('.movie-title').text();
        var movieYear = $(this).children('.movie-year').text();
        var movieData = {
          t : movieTitle,
          y : movieYear,
          plot : 'full',
          type : 'movie'
        };
        $.ajax({
          url : omdbAPI,
          data : movieData,
          success : movieCallback,
          dataType : 'json',
          complete: movieComplete
        });
        function movieCallback(movie) {
          $loader.hide();
          var regex = /,/;
          var html = '<div class="movie-wrap">';
          html += '<div class="movie">';
          html += '<div class="header">';
          html += '<div class="main-content">';
          html += '<div class="text-center">';
          html += '<h1 id="title">' + movie.Title + ' (' + movie.Year + ')</h1>';
          html += '<span>IMDB Rating: ';
          if (movie.imdbRating !== 'N/A') {
            html += '<b>' + movie.imdbRating + '</b></span>';
          } else {
            html += 'Not Rated</span>';
          }
          if (movie.Genre !== 'N/A') {
            html += '<span> | Genre: <b>' + movie.Genre + '</b></span>';
          }
          if (movie.Runtime !== 'N/A') {
            html += '<span> | Runtime: <b>' + movie.Runtime +'</b></span>';
          }
          html += '</div></div></div>';
          html += '<div class="main-content movie-content">';
          html += '<div class="poster-wrapper">';
          if (movie.Poster !== 'N/A') {
            html += '<img src="' + movie.Poster + '">';
          } else {
            html += '<i class="material-icons">crop_original</i>';
          }
          html += '</div>';
          html += '<div class="info">';
          if (movie.Plot !== 'N/A') {
            html += '<h4 id="plot-head">Plot Synopsis:</h4>';
            html += '<p id="plot-text">' + movie.Plot + '</p>';
          }
          if (movie.Director !== 'N/A') {
            html += '<h4 class="info-head">';
            if (movie.Director.match(regex)) {
              html += 'Directors:</h4>';
            } else {
              html += 'Director:</h4>';
            }
            html += '<p class="info-text">' + movie.Director + '</p>';
          }
          if (movie.Writer !== 'N/A') {
             html += '<h4 class="info-head">';
            if (movie.Writer.match(regex)) {
              html += 'Writers:</h4>';
            } else {
              html += 'Writer:</h4>';
            }
            html += '<p class="info-text">' + movie.Writer + '</p>';
          }
          if (movie.Actors !== 'N/A') {
            html += '<h4 class="info-head">';
            if (movie.Actors.match(regex)) {
              html += 'Stars:</h4>';
            } else {
              html += 'Star:</h4>';
            }
            html += '<p class="info-text">' + movie.Actors + '</p>';
          }
          html += '</div></div></div>';
          html += '<div class="action text-center">';
          html += '<a class="btn back" href="#">Search results</a>';
          html += '<a class="btn" href="http://www.imdb.com/title/' + movie.imdbID + '" target="_blank">View on IMDB</a>';
          html += '</div></div>';
          $('.main-header').after(html);
          $loader.hide();
          $('.movie-wrap').hide().fadeIn('slow');
        }
        function movieComplete() {
          // If no image to display, set a background color
          if($('.poster-wrapper').children('.material-icons').length > 0) {
            $('.poster-wrapper').css('background', '#cdcdcd');
          }
          // Go back to search results
          $('.back').click(function(e) {
            e.preventDefault();

            $('.movie-wrap').fadeOut('', function(){
              $(this).remove();
              $ul.show();
              $moreWrap.show();
            });
          });
        }
      });
    }
  });
})();