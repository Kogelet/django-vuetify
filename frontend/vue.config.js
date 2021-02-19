const BundleTracker = require("webpack-bundle-tracker");
const prefixer = require("postcss-prefix-selector");

module.exports = {
  transpileDependencies: ["vuetify"],
  publicPath: "http://127.0.0.1:8080/",
  outputDir: "./vue/",

  chainWebpack: (config) => {
    config.optimization.splitChunks(false);

    config
      .plugin("BundleTracker")
      .use(BundleTracker, [{ filename: "../frontend/webpack-stats.json" }]);

    config.resolve.alias.set("__STATIC__", "static");

    config.devServer
      .public("http://127.0.0.1:8080")
      .host("0.0.0.0")
      .port(8080)
      .hotOnly(true)
      .watchOptions({ poll: 1000 })
      .https(false)
      .headers({ "Access-Control-Allow-Origin": ["*"] });

    const sassRule = config.module.rule("sass");
    const sassNormalRule = sassRule.oneOfs.get("normal");
    // creating a new rule
    const vuetifyRule = sassRule
      .oneOf("vuetify")
      .test(/[\\/]vuetify[\\/]src[\\/]/);
    // taking all uses from the normal rule and adding them to the new rule
    Object.keys(sassNormalRule.uses.entries()).forEach((key) => {
      vuetifyRule.uses.set(key, sassNormalRule.uses.get(key));
    });
    // moving rule "vuetify" before "normal"
    sassRule.oneOfs.delete("normal");
    sassRule.oneOfs.set("normal", sassNormalRule);
    // adding prefixer to the "vuetify" rule
    vuetifyRule
      .use("vuetify")
      .loader(require.resolve("postcss-loader"))
      .tap((options = {}) => {
        options.sourceMap = process.env.NODE_ENV !== "production";
        options.plugins = [
          prefixer({
            prefix: "[data-vuetify]",
            transform(prefix, selector, prefixedSelector) {
              let result = prefixedSelector;
              if (selector.startsWith("html") || selector.startsWith("body")) {
                result = prefix + selector.substring(4);
              }
              return result;
            },
          }),
        ];
        return options;
      });
    // moving sass-loader to the end
    vuetifyRule.uses.delete("sass-loader");
    vuetifyRule.uses.set("sass-loader", sassNormalRule.uses.get("sass-loader"));
  },
};
