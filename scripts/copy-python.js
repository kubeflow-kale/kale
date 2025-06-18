#!/usr/bin/env node

/**
 * Copy Python modules to lib directory for runtime access
 * This ensures the Python modules are available when the extension runs
 * 
 * Usage:
 *   node scripts/copy-python.js
 *   jlpm copy-python
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceDir: 'src/processors',
  destDir: 'lib/processors',
  pythonFiles: [
    'notebook_to_kfp_converter.py',
    '__init__.py'
  ],
  requiredFiles: [
    'notebook_to_kfp_converter.py'  // Only the direct converter is required
  ]
};

/**
 * Ensure directory exists, create if necessary
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
    return true;
  }
  return false;
}

/**
 * Copy a single file with validation
 */
function copyFile(src, dest) {
  try {
    // Check if source exists
    if (!fs.existsSync(src)) {
      console.warn(`⚠ Source file not found: ${src}`);
      return false;
    }

    // Copy the file
    fs.copyFileSync(src, dest);
    
    // Validate the copy
    const srcStats = fs.statSync(src);
    const destStats = fs.statSync(dest);
    
    if (srcStats.size === destStats.size) {
      console.log(`✓ Copied: ${path.basename(src)} (${srcStats.size} bytes)`);
      return true;
    } else {
      console.error(`✗ Copy failed (size mismatch): ${src} → ${dest}`);
      console.error(`  Source: ${srcStats.size} bytes, Dest: ${destStats.size} bytes`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error copying ${src} → ${dest}:`, error.message);
    return false;
  }
}

/**
 * Create __init__.py if it doesn't exist
 */
function createInitFile(destDir) {
  const initPath = path.join(destDir, '__init__.py');
  
  if (!fs.existsSync(initPath)) {
    const initContent = `"""
Pipeline Builder Python Backend
Direct Notebook to KFP v2 DSL Converter
"""

from .notebook_to_kfp_converter import (
    NotebookToKFPConverter,
    convert_notebook_to_kfp,
    analyze_notebook_annotations
)

__version__ = "0.1.0"
__all__ = [
    'NotebookToKFPConverter',
    'convert_notebook_to_kfp',
    'analyze_notebook_annotations'
]
`;
    
    try {
      fs.writeFileSync(initPath, initContent, 'utf8');
      console.log(`✓ Created: __init__.py`);
      return true;
    } catch (error) {
      console.error(`✗ Error creating __init__.py:`, error.message);
      return false;
    }
  }
  
  return true;
}

/**
 * Validate Python file syntax (basic check)
 */
function validatePythonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic validation checks
    const checks = [
      {
        name: 'Non-empty',
        test: content.trim().length > 0
      },
      {
        name: 'Valid encoding',
        test: !content.includes('\uFFFD') // No replacement characters
      },
      {
        name: 'Python syntax basics',
        test: content.includes('def ') || content.includes('class ') || content.includes('import ')
      }
    ];
    
    const failed = checks.filter(check => !check.test);
    
    if (failed.length > 0) {
      console.warn(`⚠ Validation warnings for ${path.basename(filePath)}:`);
      failed.forEach(check => console.warn(`   - ${check.name}: Failed`));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`✗ Error validating ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main function to copy Python files
 */
function copyPythonFiles() {
  console.log('🐍 Pipeline Builder - Python Module Copy');
  console.log('=' .repeat(50));
  
  const sourceDir = path.join(__dirname, '..', CONFIG.sourceDir);
  const destDir = path.join(__dirname, '..', CONFIG.destDir);
  
  console.log(`📂 Source: ${sourceDir}`);
  console.log(`📂 Destination: ${destDir}`);
  
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`);
    console.error(`💡 Please create the directory and add your Python files:`);
    CONFIG.requiredFiles.forEach(file => {
      console.error(`   - ${path.join(CONFIG.sourceDir, file)}`);
    });
    return false;
  }
  
  // Ensure destination directory exists
  const destCreated = ensureDirectoryExists(destDir);
  
  // Copy files
  let successCount = 0;
  let totalFiles = 0;
  
  console.log('\n📋 Copying Python files:');
  console.log('-'.repeat(50));
  
  for (const fileName of CONFIG.pythonFiles) {
    const srcPath = path.join(sourceDir, fileName);
    const destPath = path.join(destDir, fileName);
    
    totalFiles++;
    
    if (copyFile(srcPath, destPath)) {
      // Validate the copied file
      if (fileName.endsWith('.py') && fileName !== '__init__.py') {
        validatePythonFile(destPath);
      }
      successCount++;
    }
  }
  
  // Create __init__.py if needed
  if (!CONFIG.pythonFiles.includes('__init__.py')) {
    if (createInitFile(destDir)) {
      totalFiles++;
      successCount++;
    }
  }
  
  // Summary
  console.log('-'.repeat(50));
  console.log(`📊 Copy Summary: ${successCount}/${totalFiles} files processed`);
  
  // Check required files
  const missingRequired = CONFIG.requiredFiles.filter(file => {
    return !fs.existsSync(path.join(destDir, file));
  });
  
  if (missingRequired.length > 0) {
    console.error(`❌ Missing required files:`);
    missingRequired.forEach(file => {
      console.error(`   - ${file}`);
    });
    return false;
  }
  
  if (successCount === totalFiles) {
    console.log('✅ All Python modules copied successfully!');
    return true;
  } else {
    console.error(`❌ Some files failed to copy (${totalFiles - successCount} failed)`);
    return false;
  }
}

/**
 * Validate copied files
 */
function validateCopiedFiles() {
  console.log('\n🔍 Validating copied files...');
  
  const destDir = path.join(__dirname, '..', CONFIG.destDir);
  
  if (!fs.existsSync(destDir)) {
    console.error(`❌ Destination directory not found: ${destDir}`);
    return false;
  }
  
  let validationPassed = true;
  
  for (const fileName of CONFIG.requiredFiles) {
    const filePath = path.join(destDir, fileName);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 0) {
        console.log(`✓ ${fileName}: ${stats.size} bytes`);
        
        // Additional validation for Python files
        if (fileName.endsWith('.py')) {
          if (!validatePythonFile(filePath)) {
            validationPassed = false;
          }
        }
      } else {
        console.error(`✗ ${fileName}: Empty file!`);
        validationPassed = false;
      }
    } else {
      console.error(`✗ ${fileName}: Missing!`);
      validationPassed = false;
    }
  }
  
  if (validationPassed) {
    console.log('✅ Validation passed - all required files present and valid');
  } else {
    console.error('❌ Validation failed - some files are missing or invalid');
  }
  
  return validationPassed;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
🐍 Pipeline Builder Python Copy Script

Usage:
  node scripts/copy-python.js [options]

Options:
  --help, -h     Show this help message
  --validate     Only validate existing files
  --clean        Clean destination directory first
  --verbose      Show detailed output

Files copied:
${CONFIG.pythonFiles.map(f => `  - ${f}`).join('\n')}

Required files:
${CONFIG.requiredFiles.map(f => `  - ${f}`).join('\n')}

Source: ${CONFIG.sourceDir}/
Destination: ${CONFIG.destDir}/
`);
}

/**
 * Clean destination directory
 */
function cleanDestination() {
  const destDir = path.join(__dirname, '..', CONFIG.destDir);
  
  if (fs.existsSync(destDir)) {
    console.log(`🧹 Cleaning destination directory: ${destDir}`);
    try {
      fs.rmSync(destDir, { recursive: true, force: true });
      console.log('✓ Destination cleaned');
      return true;
    } catch (error) {
      console.error(`✗ Error cleaning destination:`, error.message);
      return false;
    }
  }
  
  return true;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('--clean')) {
    if (!cleanDestination()) {
      process.exit(1);
    }
  }
  
  if (args.includes('--validate')) {
    const success = validateCopiedFiles();
    process.exit(success ? 0 : 1);
    return;
  }
  
  // Perform the copy operation
  console.log('🚀 Starting Python module copy process...');
  console.log(`⏰ ${new Date().toISOString()}\n`);
  
  const copySuccess = copyPythonFiles();
  const validationSuccess = validateCopiedFiles();
  
  console.log('\n' + '='.repeat(50));
  
  if (copySuccess && validationSuccess) {
    console.log('🎉 Python module copying completed successfully!');
    console.log('💡 Files are now available for the JupyterLab extension');
    process.exit(0);
  } else {
    console.error('💥 Python module copying failed!');
    console.error('💡 Please check the errors above and try again');
    process.exit(1);
  }
}

// Export functions for testing
module.exports = {
  copyPythonFiles,
  validateCopiedFiles,
  ensureDirectoryExists,
  copyFile,
  CONFIG
};

// Run the script if called directly
if (require.main === module) {
  main();
}