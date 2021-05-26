const path = require('path');

module.exports = {
  mode: "production",
  entry: "./lib/index.js",
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
  }
};