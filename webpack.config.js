const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    background: "./src/background.js",
    content: "./src/content.js",
    popup: "./src/popup.js",
    types: "./src/types.js",
    options: "./src/options.js",
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
        { from: "src/styles.css", to: "styles.css" },
        { from: "src/popup.html", to: "popup.html" },
        { from: "src/popup.css", to: "popup.css" },
        { from: "src/options.html", to: "options.html" },
        { from: "src/options.css", to: "options.css" },
        { from: "hugin_mugin_logo2.png", to: "hugin_mugin_logo2.png" },
      ],
    }),
  ],
};
