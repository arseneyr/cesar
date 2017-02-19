const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './main.jsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build')
  },
  resolve: {
    extensions: [
      '.js',
      '.jsx'
    ]
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: path.resolve(__dirname, 'node_modules'),
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [[ 'es2015', { modules: false } ], 'react']
            }
          }
        ]
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin()]
}