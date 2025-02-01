const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    background: "./src/background.js",
    config: "./src/config.js",
    content: "./src/content.js",
    options: "./src/options.js",
    popup: "./src/popup.js",
<<<<<<< HEAD
    notification: "./src/components/notification.js",
=======
>>>>>>> 8ad9502cef4b3afba1e1a188488127f457937b19
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
<<<<<<< HEAD
=======
        { from: "src/options.css", to: "options.css" },
>>>>>>> 8ad9502cef4b3afba1e1a188488127f457937b19
      ],
    }),
  ],
};
