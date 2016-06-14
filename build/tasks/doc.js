var gulp = require('gulp');
var paths = require('../paths');
var typedoc = require('gulp-typedoc');
var runSequence = require('run-sequence');
var through2 = require('through2');
var to5 = require('gulp-babel');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');

gulp.task('doc-generate', function(){
  return gulp.src([paths.output + paths.packageName + '.d.ts'])
    .pipe(typedoc({
      target: 'es6',
      includeDeclarations: true,
      moduleResolution: 'node',
      json: paths.doc + '/api.json',
      name: paths.packageName + '-docs', 
      mode: 'modules',
      excludeExternals: true,
      ignoreCompilerErrors: false,
      version: true
    }));
});

gulp.task('doc-shape', function(){
  return gulp.src([paths.doc + '/api.json'])
    .pipe(through2.obj(function(file, enc, callback) {
      var json = JSON.parse(file.contents.toString('utf8')).children[0];

      json = {
        name: paths.packageName,
        children: json.children,
        groups: json.groups
      };

      file.contents = new Buffer(JSON.stringify(json));
      this.push(file);
      return callback();
    }))
    .pipe(gulp.dest(paths.doc));
});

function removeDTSPlugin(options) {
  var found = options.plugins.find(function(x){
    return x instanceof Array;
  });

  var index = options.plugins.indexOf(found);
  options.plugins.splice(index, 1);
  return options;
}

gulp.task('build-example-js', function() {
  return gulp.src(paths.exampleSource + '**/*.js')
    .pipe(to5(assign({}, removeDTSPlugin(compilerOptions.amd()))))
    .pipe(gulp.dest(paths.exampleOutput));
});

gulp.task('build-example-html', function() {
  return gulp.src(paths.exampleSource + '**/*.html')
    .pipe(gulp.dest(paths.exampleOutput));
});

gulp.task('doc', function(callback){
  return runSequence(
    'doc-generate',
    'doc-shape',
    'build-example-js',
    'build-example-html',
    callback
  );
});
