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
    'connectable-binding.js',
    'subscriber-collection.js',
    'array-change-records.js',
    'map-change-records.js',
    'collection-observation.js',
    'array-observation.js',
    'ast.js',
    'binding-mode.js',
    'lexer.js',
    'parser.js',
    'map-observation.js',
    'event-manager.js',
    'dirty-checking.js',
    'property-observation.js',
    'element-observation.js',
    'class-observer.js',
    'computed-observation.js',
    'svg.js',
    'observer-locator.js',
    'binding-expression.js',
    'call-expression.js',
    'value-converter-resource.js',
    'binding-behavior-resource.js',
    'decorators.js',
    'listener-expression.js',
    'name-expression.js',
    'binding-engine.js'
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

gulp.task('build-es6', function () {
  return gulp.src(paths.output + jsName)
    .pipe(gulp.dest(paths.output + 'es6'));
});

gulp.task('build-commonjs', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions, {modules:'common'})))
    .pipe(gulp.dest(paths.output + 'commonjs'));
});

gulp.task('build-amd', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions, {modules:'amd'})))
    .pipe(gulp.dest(paths.output + 'amd'));
});

gulp.task('build-system', function () {
  return gulp.src(paths.output + jsName)
    .pipe(to5(assign({}, compilerOptions, {modules:'system'})))
    .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build-dts', function(){
  return gulp.src(paths.output + paths.packageName + '.d.ts')
      .pipe(rename(paths.packageName + '.d.ts'))
      .pipe(gulp.dest(paths.output + 'es6'))
      .pipe(gulp.dest(paths.output + 'commonjs'))
      .pipe(gulp.dest(paths.output + 'amd'))
      .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    'build-index',
    ['build-es6', 'build-commonjs', 'build-amd', 'build-system'],
    'build-dts',
    callback
  );
});
