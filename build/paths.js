var path = require('path');
var fs = require('fs');

// hide warning //
var emitter = require('events');
emitter.defaultMaxListeners = 20;

var appRoot = 'src/';
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

var paths = {
  root: appRoot,
  source: appRoot + '**/*.js',
  html: appRoot + '**/*.html',
  style: 'styles/**/*.css',
  output: 'dist/',
  doc:'./doc',
  e2eSpecsSrc: 'test/e2e/src/*.js',
  e2eSpecsDist: 'test/e2e/dist/',
  exampleSource: 'doc/example/',
  exampleOutput: 'doc/example-dist/',
  packageName: pkg.name,
  ignore: [],
  useTypeScriptForDTS: false,
  importsToAdd: [],
  sort: false
};

paths.files = [
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

module.exports = paths;
