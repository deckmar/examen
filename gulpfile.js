var gulp = require('gulp'),
    less = require('gulp-less'),
    concat = require('gulp-concat'),
    webserver = require('gulp-webserver');
 

// Static web server with HTTPS support
//
// For HTTPS you need to generate your own key and self-signed cert for 
// localhost.deckmar.net (or ask me for mine) and replace in node_modules/gulp-webserver/ssl/
//
// Otherwise remove "https" and "host"
gulp.task('webserver', function() {
  gulp.src('.')
    .pipe(webserver({
      livereload: {
        enable: true,
        filter: function(file) {
          file = file.replace(/\\/g, '/');

          if (file.indexOf("/menyn3/dest") >= 0) return true;
          if (file.indexOf("/menyn3/templates") >= 0) return true;
          
          return false;
        }
      },
      directoryListing: true,
      open: true,
      port: 1280,
      https: true,
      host: 'localhost.deckmar.net',
      fallback: 'index.html' // For html5mode ui-router routing
    }));
});

gulp.task('less', function() {
  gulp.src('less/*.less')
    .pipe(less())
    .pipe(gulp.dest('./dest/'))
});

gulp.task('concat_js', function() {
  gulp.src('components/*.js')
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./dest/'))
})

gulp.task('watch', function() {
  gulp.watch('./less/*.less', ['less']);
  gulp.watch(['./components/**/*.js'], ['concat_js']);
});


// When starting with just "gulp" from command line
gulp.task('default', ['webserver', 'watch']);