const path = require('path');
var Visualizer = require('webpack-visualizer-plugin');

module.exports = {
  mode: "production",
  entry: "./lib/main.js",
  devtool: "source-map",
  output: {
    filename: 'pcf.sdk.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'PCF',
    libraryTarget: 'umd',
  },
  target: 'web',
  optimization: {
    minimize: true
  },
  plugins: [new Visualizer()]
};