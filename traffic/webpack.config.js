const webpack = require('webpack');
const path = require('path');

const config = {
  entry: './src/js/traffic.js',
	watch: true,
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'
  }
};

module.exports = config;