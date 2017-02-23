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
              presets: [[ 'es2015', { modules: false } ], 'react'],
              plugins: ['transform-class-properties', 'transform-object-rest-spread']
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /(png|woff|woff2|ttf|svg|eot)$/,
        use: ['file-loader']
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