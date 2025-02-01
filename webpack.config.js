const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    background: "./src/background.js",
    options: "./src/options.js",
    popup: "./src/popup.js",
    notification: "./src/components/notification.js",
  },
  output: {
    filename: "[name].js", // Produces dist/background.js, dist/content.js, etc.
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "src/popup.html", to: "popup.html" },
        { from: "src/options.html", to: "options.html" },
        { from: "src/options.css", to: "options.css" },
      ],
    }),
  ],
};
