const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: ['whatwg-fetch', './main.jsx'],
  output: {
    filename: 'bundle.[hash].js',
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
              presets: [[ 'es2015', { modules: false } ], 'react'],
              plugins: ['transform-class-properties', 'transform-object-rest-spread']
            }
          }
        ]
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin({
    template: path.resolve(__dirname, './template.html')
  })],
  devServer: {
    host: '0.0.0.0'
  }
}