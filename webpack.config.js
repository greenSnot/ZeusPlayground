const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.tsx',
    no_interpreter: './test/no_interpreter.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.worker\.ts$/,
        use: { loader: 'worker-loader' },
        exclude: /node_modules/,
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        use: [
          { loader: "style-loader" },
          {
            loader: "typings-for-css-modules-loader",
            query: {
              modules: true,
              namedExport: true,
              localIdentName: "[name]_[local]_[hash:base64:5]"
            }
          },
          { loader: "less-loader" }
        ]
      }
    ],
  },
  resolve: {
    extensions: [ '.ts', '.tsx', '.js' ]
  },
  plugins: [
    new CopyWebpackPlugin([
      'images',
    ].map(i => ({from: i, to: i})), {}),
    new HtmlWebpackPlugin({
      filename: './index.html',
      chunks: ['index'],
      template: './index.html',
    }),
    new HtmlWebpackPlugin({
      filename: './no_interpreter.html',
      chunks: ['no_interpreter'],
      template: './no_interpreter.html',
    }),
  ],
};