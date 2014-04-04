gulp-importjs
=============

Gulp plugin for allowing imports in JS files.

##Usage
Create a new js file with a .jsrc extension.
```javascript
@import "/path/to/file.js";
```

In your gulpfile.js...
```javascript
var gulp     = require('gulp');
var importjs = require('gulp-importjs');
var rename   = require('gulp-rename');

gulp.task('importjs', function() {
  return gulp.src(['folder/to/run/importjs/on'])
    .pipe(importjs())
    .pipe(rename({extname: '.js'}))
    .pipe(gulp.dest('folder/to/save/to'));
});

gulp.task('default', ['importjs']);
```
