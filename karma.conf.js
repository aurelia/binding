const { resolve } = require('path');

module.exports = function configure(config) {
  const options = {
    frameworks: ['source-map-support', 'jasmine'],
    files: [
      'test/parser.spec.js'
    ],
    preprocessors: {
      ['test/parser.spec.js']: ['webpack', 'sourcemap']
    },
    webpack: {
      mode: 'development',
      entry: { setup: './test/setup.js' },
      resolve: {
        extensions: ['.js'],
        modules: [
          resolve(__dirname, 'src'),
          resolve(__dirname, 'node_modules')
        ]
      },
      module: {
        rules: [
          {
            test: /\.js$/i,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [ 'es2015-loose', 'stage-1'],
                plugins: [
                  'syntax-flow',
                  'transform-decorators-legacy',
                  'transform-flow-strip-types'
                ]
              }
            }
          }
        ]
      },
      devtool: 'inline-source-map'
    },
    reporters: ['progress'],
    singleRun: false,
    colors: true,
    logLevel: config.browsers && config.browsers[0] === 'ChromeDebugging' ? config.LOG_DEBUG : config.LOG_INFO,
    webpackMiddleware: { stats: 'errors-only' },
    browsers: config.browsers || ['ChromeHeadless'],
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: [
          '--remote-debugging-port=9333'
        ],
        debug: true
      }
    }
  };

  config.set(options);
}
