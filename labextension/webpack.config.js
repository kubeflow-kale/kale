// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * Custom webpack configuration to suppress source map warnings from dependencies.
 *
 * PROBLEM:
 * Some npm packages (domutils@3.2.2, entities@4.5.0, htmlparser2@8.0.2) have
 * malformed source maps with sourceRoot pointing to GitHub URLs:
 *   "sourceRoot": "https://raw.githubusercontent.com/fb55/domutils/..."
 * instead of relative paths. This is a publishing bug in these packages.
 *
 * WHY SUPPRESSION IS ACCEPTABLE:
 * 1. The warnings don't affect functionality - the code works perfectly
 * 2. Source maps from dependencies aren't needed for debugging your own code
 * 3. These are transitive dependencies (via react-sanitized-html), not direct deps
 * 4. The packages are stable and widely used (htmlparser2 has 34M+ weekly downloads)
 * 5. This is a standard practice in many production webpack configs
 *
 * ALTERNATIVE SOLUTIONS CONSIDERED:
 * 1. ✗ Update packages - Already using latest compatible versions
 * 2. ✗ Fix upstream - Would require waiting for maintainers and new releases
 * 3. ✗ Use patch-package - Overkill for cosmetic warnings
 * 4. ✗ Disable source-map-loader - Can't override JupyterLab's built-in config
 * 5. ✓ Suppress specific warnings - Clean, maintainable, doesn't hide real issues
 *
 * Your own source code will still have full source map support for debugging.
 */

module.exports = {
  ignoreWarnings: [
    (warning) => {
      // Ignore source map warnings from packages with known broken source maps
      if (warning.module?.resource) {
        const resource = warning.module.resource;
        return (
          resource.includes('node_modules/domutils') ||
          resource.includes('node_modules/entities') ||
          resource.includes('node_modules/htmlparser2')
        );
      }

      // Also catch warnings that mention these packages in the message
      if (warning.message) {
        const isFromBrokenPackage =
          warning.message.includes('node_modules/domutils') ||
          warning.message.includes('node_modules/entities') ||
          warning.message.includes('node_modules/htmlparser2');

        const isSourceMapWarning =
          warning.message.includes('Invalid dependencies') ||
          warning.message.includes('Failed to parse source map');

        return isFromBrokenPackage && isSourceMapWarning;
      }

      return false;
    },
  ],
};
