const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    background: "./src/js/background.js",
    notification: "./src/js/notification.js",
    popup: "./src/js/popup/popup.js",
    options: "./src/js/options/options.js",
  },
  output: {
    filename: "js/[name].js", // Produces dist/js/background.js, dist/js/popup.js, etc.
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".js"],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/manifest.json", to: "" }, // Copy manifest
        { from: "src/css/styles.css", to: "css" }, // Copy CSS
        { from: "src/assets/hugin_mugin_logo2.png", to: "assets" },
      ],
    }),
    new HtmlWebpackPlugin({
      template: "./src/js/popup/popup.html",
      filename: "popup/popup.html",
      chunks: ["popup"],
    }),
    new HtmlWebpackPlugin({
      template: "./src/js/options/options.html",
      filename: "options/options.html",
      chunks: ["options"],
    }),
    new MiniCssExtractPlugin({
      // Configure CSS extraction
      filename: "css/styles.css", // Output CSS file
    }),
  ],
};
