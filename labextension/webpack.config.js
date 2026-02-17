// Suppress source map warnings from dependencies with malformed sourcemaps
// (domutils, entities, htmlparser2 via react-sanitized-html)
module.exports = {
  ignoreWarnings: [
    warning =>
      warning.module?.resource?.includes('node_modules/domutils') ||
      warning.module?.resource?.includes('node_modules/entities') ||
      warning.module?.resource?.includes('node_modules/htmlparser2'),
  ],
};
