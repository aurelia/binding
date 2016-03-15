var gulp = require('gulp');
var runSequence = require('run-sequence');
var to5 = require('gulp-babel');
var paths = require('../paths');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');
var through2 = require('through2');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var rename = require('gulp-rename');
var tools = require('aurelia-tools');

var jsName = paths.packageName + '.js';

gulp.task('build-index', function(){
  var importsToAdd = [];
  var files = [
    'camel-case.js',
    'scope.js',
    'connectable-binding.js',
    'connect-queue.js',
    'subscriber-collection.js',
    'expression-observer.js',
    'array-change-records.js',
    'map-change-records.js',
    'collection-observation.js',
    'array-observation.js',
    'ast.js',
    'unparser.js',
    'expression-cloner.js',
    'binding-mode.js',
    'lexer.js',
    'parser.js',
    'map-observation.js',
    'event-manager.js',
    'dirty-checking.js',
    'property-observation.js',
    'element-observation.js',
    'checked-observer.js',
    'select-value-observer.js',
    'class-observer.js',
    'computed-observation.js',
    'svg.js',
    'observer-locator.js',
    'binding-expression.js',
    'call-expression.js',
    'value-converter-resource.js',
    'binding-behavior-resource.js',
    'listener-expression.js',
    'name-expression.js',
    'binding-engine.js',
    'set-observation.js',
    'decorator-observable.js'
    ].map(function(file){
      return paths.root + file;
  });

  return gulp.src(files)
    .pipe(through2.obj(function(file, enc, callback) {
      file.contents = new Buffer(tools.extractImports(file.contents.toString("utf8"), importsToAdd));
      this.push(file);
      return callback();
    }))
    .pipe(concat(jsName))
    .pipe(insert.transform(function(contents) {
      return tools.createImportBlock(importsToAdd) + contents;
    }))
    .pipe(gulp.dest(paths.output));
});

gulp.task('build-es2015', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions.es2015())))
    .pipe(gulp.dest(paths.output + 'es2015'));
});

gulp.task('build-commonjs', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions.commonjs())))
    .pipe(gulp.dest(paths.output + 'commonjs'));
});

gulp.task('build-amd', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions.amd())))
    .pipe(gulp.dest(paths.output + 'amd'));
});

gulp.task('build-system', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions.system())))
    .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build-dts', function(){
  return gulp.src(paths.root + paths.packageName + '.d.ts')
    .pipe(gulp.dest(paths.output))
    .pipe(gulp.dest(paths.output + 'es2015'))
    .pipe(gulp.dest(paths.output + 'commonjs'))
    .pipe(gulp.dest(paths.output + 'amd'))
    .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    'build-index',
    ['build-es2015', 'build-commonjs', 'build-amd', 'build-system'],
    'build-dts',
    callback
  );
});
