module.exports = {
  rollup(config) {
    if (config.output.format === "umd") {
      config.external = (id) => {
        // bundle in polyfills as TSDX can't (yet) ensure they're installed as deps
        console.log({ id });
        if (id.includes("@hotwired/turbo")) {
          return true;
        }

        return false;
      };

      config.output.globals["@hotwired/turbo"] = "Turbo";
    }
    return config;
  },
};
