const path = require('path');

module.exports = {
  mode: "production",
  entry: "./lib/main.js",
  devtool: "source-map",
  output: {
    filename: 'cred-sdk.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'CRED',
    libraryTarget: 'umd',
  },
  target: 'web',
  optimization: {
    minimize: true
  }
};