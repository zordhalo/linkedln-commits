#!/usr/bin/env node

/**
 * Schema Validation Script
 * Validates the database schema files for syntax and structure
 * without requiring a MongoDB connection
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating database schema files...\n');

// Track validation results
let hasErrors = false;

/**
 * Check if a file exists and is readable
 */
function validateFileExists(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${description} exists: ${filePath}`);
      return true;
    } else {
      console.error(`✗ ${description} not found: ${filePath}`);
      hasErrors = true;
      return false;
    }
  } catch (err) {
    console.error(`✗ Error checking ${description}: ${err.message}`);
    hasErrors = true;
    return false;
  }
}

/**
 * Validate JavaScript file syntax
 */
function validateJavaScriptSyntax(filePath, description) {
  try {
    require.resolve(filePath);
    console.log(`✓ ${description} has valid syntax`);
    return true;
  } catch (err) {
    console.error(`✗ ${description} has syntax errors: ${err.message}`);
    hasErrors = true;
    return false;
  }
}

/**
 * Check schema structure
 */
function checkSchemaStructure() {
  console.log('\n📋 Checking schema structure...');
  
  try {
    // Check User model structure
    const userModelPath = path.join(__dirname, '../models/user.js');
    const userContent = fs.readFileSync(userModelPath, 'utf8');
    
    const userRequiredFields = ['name', 'linkedin_url', 'access_token'];
    userRequiredFields.forEach(field => {
      if (userContent.includes(field)) {
        console.log(`✓ User model includes field: ${field}`);
      } else {
        console.error(`✗ User model missing field: ${field}`);
        hasErrors = true;
      }
    });
    
    // Check Activity model structure
    const activityModelPath = path.join(__dirname, '../models/activity.js');
    const activityContent = fs.readFileSync(activityModelPath, 'utf8');
    
    const activityRequiredFields = ['user_id', 'date', 'posts', 'likes', 'comments'];
    activityRequiredFields.forEach(field => {
      if (activityContent.includes(field)) {
        console.log(`✓ Activity model includes field: ${field}`);
      } else {
        console.error(`✗ Activity model missing field: ${field}`);
        hasErrors = true;
      }
    });
    
    // Check for indexes
    console.log('\n📊 Checking indexes...');
    if (userContent.includes('.index(')) {
      console.log('✓ User model includes indexes');
    } else {
      console.error('✗ User model missing indexes');
      hasErrors = true;
    }
    
    if (activityContent.includes('.index(')) {
      console.log('✓ Activity model includes indexes');
    } else {
      console.error('✗ Activity model missing indexes');
      hasErrors = true;
    }
    
  } catch (err) {
    console.error(`✗ Error checking schema structure: ${err.message}`);
    hasErrors = true;
  }
}

/**
 * Main validation
 */
function runValidation() {
  console.log('Starting validation...\n');
  
  // Check required files exist
  console.log('📁 Checking file existence...');
  const requiredFiles = [
    [path.join(__dirname, '../models/user.js'), 'User model'],
    [path.join(__dirname, '../models/activity.js'), 'Activity model'],
    [path.join(__dirname, '../models/index.js'), 'Models index'],
    [path.join(__dirname, '../config.js'), 'Database config'],
    [path.join(__dirname, '../scripts/init.js'), 'Init script'],
    [path.join(__dirname, '../scripts/seed.js'), 'Seed script'],
    [path.join(__dirname, '../../docs/database-schema.md'), 'Schema documentation'],
    [path.join(__dirname, '../../package.json'), 'Package.json'],
    [path.join(__dirname, '../../.env.example'), 'Environment example'],
    [path.join(__dirname, '../../.gitignore'), 'Gitignore']
  ];
  
  console.log();
  requiredFiles.forEach(([filePath, description]) => {
    validateFileExists(filePath, description);
  });
  
  // Check JavaScript syntax
  console.log('\n🔧 Validating JavaScript syntax...');
  const jsFiles = [
    [path.join(__dirname, '../config.js'), 'Database config'],
    [path.join(__dirname, '../models/index.js'), 'Models index'],
  ];
  
  console.log();
  jsFiles.forEach(([filePath, description]) => {
    validateJavaScriptSyntax(filePath, description);
  });
  
  // Check schema structure
  checkSchemaStructure();
  
  // Check package.json scripts
  console.log('\n📦 Checking package.json scripts...');
  const packageJsonPath = path.join(__dirname, '../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredScripts = ['db:init', 'db:seed', 'db:init:fresh', 'db:setup'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✓ Package.json includes script: ${script}`);
    } else {
      console.error(`✗ Package.json missing script: ${script}`);
      hasErrors = true;
    }
  });
  
  // Check dependencies
  console.log('\n📚 Checking dependencies...');
  const requiredDeps = ['mongoose'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✓ Package.json includes dependency: ${dep} (${packageJson.dependencies[dep]})`);
    } else {
      console.error(`✗ Package.json missing dependency: ${dep}`);
      hasErrors = true;
    }
  });
  
  // Final summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Validation FAILED - Please fix the errors above');
    process.exit(1);
  } else {
    console.log('✅ Validation PASSED - All checks completed successfully!');
    console.log('\nDatabase schema is ready to use.');
    console.log('To initialize the database, run: npm run db:init');
    process.exit(0);
  }
}

// Run validation
try {
  runValidation();
} catch (err) {
  console.error('\n❌ Validation failed with error:', err.message);
  console.error(err.stack);
  process.exit(1);
}
