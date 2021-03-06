const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

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
              plugins: ['lodash', 'transform-class-properties', 'transform-object-rest-spread']
            }
          }
        ]
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin({
    template: path.resolve(__dirname, './template.html')
  }),
  new LodashModuleReplacementPlugin({flattening: true})],
  devServer: {
    host: '0.0.0.0'
  }
}