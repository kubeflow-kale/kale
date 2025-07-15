#!/usr/bin/env node

/**
 * Copy Python modules to lib directory for runtime access
 * Basic copy script for existing kale_marshal and processor files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceDir: 'src/',
  destDir: 'lib/',
  // backendSourceDir: 'src/backend',
  // backendDestDir: 'lib/backend',
  // commonSourceDir: 'src/common',
  // commonDestDir: 'lib/common',
};

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created: ${dirPath}`);
  }
}

/**
 * Copy a single file
 */
function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.basename(src)}`);
    return true;
  } else {
    console.warn(`Not found: ${src}`);
    return false;
  }
}

/**
 * Copy entire directory recursively
 */
function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`Source directory not found: ${srcDir}`);
    return false;
  }

  ensureDir(destDir);
  
  const items = fs.readdirSync(srcDir);
  
  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
  
  return true;
}

/**
 * Main copy function
 */
function main() {
  console.log('Copying Python modules...');
  
  const baseDir = path.join(__dirname, '..');
  
  // Copy processors directory
  const processorsSource = path.join(baseDir, CONFIG.sourceDir);
  const processorsDestination = path.join(baseDir, CONFIG.destDir);
  
  console.log('\nCopying processors:');
  copyDir(processorsSource, processorsDestination);
  
  // Copy backend directory
  // const backendSource = path.join(baseDir, CONFIG.backendSourceDir);
  // const backendDestination = path.join(baseDir, CONFIG.backendDestDir);
  
  // console.log('\nCopying backend:');
  // copyDir(backendSource, backendDestination);

  // // Copy common directory
  // const commonSource = path.join(baseDir, CONFIG.commonSourceDir);
  // const commonDestination = path.join(baseDir, CONFIG.commonDestDir);

  // console.log('\nCopying common:');
  // copyDir(commonSource, commonDestination);
  
  console.log('\nCopy completed!');
}

if (require.main === module) {
  main();
}

module.exports = { main };