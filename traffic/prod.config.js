const webpack = require('webpack');
const path = require('path');

const config = {
  entry: './src/js/traffic.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'/*,
    globalObject: "this"*/
  }
};

module.exports = config;
