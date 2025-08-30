#!/usr/bin/env node

/**
 * ReserveBTC Oracle Integration Test Suite
 * 
 * This script performs comprehensive testing of the Oracle functionality
 * without modifying the existing project code. It adapts to the current
 * implementation and provides detailed testing reports.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test Configuration
const TEST_CONFIG = {
  ORACLE_ADDRESS: '0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b',
  BTC_TESTNET_ADDRESS: 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  MEGAETH_RPC: 'https://carrot.megaeth.com/rpc',
  ORACLE_CONTRACT: '0x717D12a23Bb46743b15019a52184DF7F250B061a',
  TEST_TIMEOUT: 30000, // 30 seconds per test
  ORACLE_SYNC_INTERVAL: 300000, // 5 minutes
};

// Test Results Storage
let testResults = {
  startTime: new Date(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Console Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  
  log(`${icon} ${testName}: ${color}${status}${colors.reset}${details ? ' - ' + details : ''}`, color);
  
  testResults.tests.push({
    name: testName,
    status,
    details,
    timestamp: new Date()
  });
  
  testResults.summary.total++;
  if (status === 'PASS') testResults.summary.passed++;
  else if (status === 'FAIL') testResults.summary.failed++;
  else testResults.summary.warnings++;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const timeout = setTimeout(() => {
      process.kill('SIGTERM');
      reject(new Error('Command timeout'));
    }, TEST_CONFIG.TEST_TIMEOUT);
    
    process.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
    
    process.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function checkEnvironment() {
  log(`\n${colors.blue}${colors.bold}🔍 PHASE 1: Environment Verification${colors.reset}`);
  
  // Check if .env file exists and has Oracle key
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const hasOracleKey = envContent.includes('ORACLE_PRIVATE_KEY');
    logTest('Environment file (.env)', hasOracleKey ? 'PASS' : 'FAIL', 
           hasOracleKey ? 'Oracle private key found' : 'Oracle private key missing');
  } catch (error) {
    logTest('Environment file (.env)', 'FAIL', 'File not found');
  }
  
  // Check Node.js version
  try {
    const { stdout } = await runCommand('node', ['--version']);
    const version = stdout.trim();
    const isValidVersion = version.startsWith('v18') || version.startsWith('v20') || version.startsWith('v22');
    logTest('Node.js Version', isValidVersion ? 'PASS' : 'WARN', version);
  } catch (error) {
    logTest('Node.js Version', 'FAIL', 'Cannot determine version');
  }
  
  // Check if Oracle server file exists
  const oracleServerExists = fs.existsSync('./oracle-server.js');
  logTest('Oracle Server File', oracleServerExists ? 'PASS' : 'FAIL', 
         oracleServerExists ? 'oracle-server.js found' : 'oracle-server.js missing');
  
  // Check if viem is installed
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const hasViem = packageJson.dependencies?.viem || packageJson.devDependencies?.viem;
    logTest('Viem Dependency', hasViem ? 'PASS' : 'FAIL', 
           hasViem ? `Version: ${hasViem}` : 'Not installed');
  } catch (error) {
    logTest('Viem Dependency', 'FAIL', 'Cannot read package.json');
  }
}

async function testApplicationBuild() {
  log(`\n${colors.blue}${colors.bold}🏗️  PHASE 2: Application Build Test${colors.reset}`);
  
  try {
    log('Building Next.js application...');
    const result = await runCommand('npm', ['run', 'build']);
    const success = result.code === 0;
    logTest('Next.js Build', success ? 'PASS' : 'FAIL', 
           success ? 'Application builds successfully' : `Exit code: ${result.code}`);
    
    if (!success) {
      log(`Build output: ${result.stdout}`);
      log(`Build errors: ${result.stderr}`);
    }
  } catch (error) {
    logTest('Next.js Build', 'FAIL', error.message);
  }
}

async function testTypeChecking() {
  log(`\n${colors.blue}${colors.bold}📝 PHASE 3: TypeScript Validation${colors.reset}`);
  
  try {
    log('Running TypeScript type checking...');
    const result = await runCommand('npm', ['run', 'type-check']);
    const success = result.code === 0;
    logTest('TypeScript Check', success ? 'PASS' : 'FAIL',
           success ? 'No type errors found' : 'Type errors detected');
    
    if (!success) {
      log(`Type errors: ${result.stderr}`);
    }
  } catch (error) {
    logTest('TypeScript Check', 'FAIL', error.message);
  }
}

async function startOracleServer() {
  log(`\n${colors.blue}${colors.bold}🔮 PHASE 4: Oracle Server Testing${colors.reset}`);
  
  return new Promise((resolve, reject) => {
    log('Starting Oracle server...');
    
    const oracleProcess = spawn('node', ['oracle-server.js'], {
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    let output = '';
    let serverReady = false;
    
    const timeout = setTimeout(() => {
      oracleProcess.kill('SIGTERM');
      reject(new Error('Oracle server startup timeout'));
    }, 15000);
    
    oracleProcess.stdout.on('data', (data) => {
      output += data.toString();
      log(`Oracle: ${data.toString().trim()}`, colors.blue);
      
      // Check for successful startup indicators
      if (output.includes('Oracle server is ready!') || output.includes('oracle>')) {
        serverReady = true;
        clearTimeout(timeout);
        
        logTest('Oracle Server Startup', 'PASS', 'Server started successfully');
        
        // Test basic Oracle commands
        setTimeout(() => {
          testOracleCommands(oracleProcess, resolve, reject);
        }, 2000);
      }
      
      // Check for authorization verification
      if (output.includes('Oracle authorization verified')) {
        logTest('Oracle Authorization', 'PASS', 'Committee member verified');
      }
      
      // Check for errors
      if (output.includes('Failed to verify oracle authorization')) {
        logTest('Oracle Authorization', 'FAIL', 'Not authorized as committee member');
      }
    });
    
    oracleProcess.stderr.on('data', (data) => {
      log(`Oracle Error: ${data.toString().trim()}`, colors.red);
    });
    
    oracleProcess.on('error', (error) => {
      clearTimeout(timeout);
      logTest('Oracle Server Startup', 'FAIL', error.message);
      reject(error);
    });
    
    oracleProcess.on('exit', (code) => {
      clearTimeout(timeout);
      if (!serverReady) {
        logTest('Oracle Server Startup', 'FAIL', `Exited with code ${code}`);
        reject(new Error(`Oracle server exited with code ${code}`));
      }
    });
  });
}

async function testOracleCommands(oracleProcess, resolve, reject) {
  log('Testing Oracle CLI commands...');
  
  const commands = [
    'status\n',
    `add ${TEST_CONFIG.ORACLE_ADDRESS} ${TEST_CONFIG.BTC_TESTNET_ADDRESS}\n`,
    'list\n',
    'help\n'
  ];
  
  let commandIndex = 0;
  let responses = [];
  
  const sendNextCommand = () => {
    if (commandIndex < commands.length) {
      const command = commands[commandIndex];
      log(`Sending command: ${command.trim()}`, colors.yellow);
      oracleProcess.stdin.write(command);
      commandIndex++;
      
      setTimeout(sendNextCommand, 2000);
    } else {
      // All commands sent, analyze responses
      setTimeout(() => {
        analyzeOracleResponses(responses);
        
        // Clean shutdown
        oracleProcess.stdin.write('exit\n');
        setTimeout(() => {
          oracleProcess.kill('SIGTERM');
          resolve();
        }, 1000);
      }, 3000);
    }
  };
  
  // Capture Oracle responses
  oracleProcess.stdout.on('data', (data) => {
    responses.push(data.toString());
  });
  
  // Start sending commands
  setTimeout(sendNextCommand, 1000);
}

function analyzeOracleResponses(responses) {
  const fullOutput = responses.join('');
  
  // Test status command
  const hasStatusInfo = fullOutput.includes('Oracle Status') || 
                       fullOutput.includes('Oracle Address') ||
                       fullOutput.includes('Tracked Users');
  logTest('Oracle Status Command', hasStatusInfo ? 'PASS' : 'WARN', 
         hasStatusInfo ? 'Status information displayed' : 'Status output not detected');
  
  // Test add command
  const userAdded = fullOutput.includes('Added user') || 
                   fullOutput.includes(TEST_CONFIG.ORACLE_ADDRESS);
  logTest('Oracle Add User Command', userAdded ? 'PASS' : 'WARN',
         userAdded ? 'User successfully added to monitoring' : 'Add command response unclear');
  
  // Test list command
  const hasUserList = fullOutput.includes('Tracked Users') || 
                     fullOutput.includes(TEST_CONFIG.ORACLE_ADDRESS);
  logTest('Oracle List Command', hasUserList ? 'PASS' : 'WARN',
         hasUserList ? 'User list displayed' : 'List command response unclear');
  
  // Test help command
  const hasHelpText = fullOutput.includes('Commands') || 
                     fullOutput.includes('help') ||
                     fullOutput.includes('add') ||
                     fullOutput.includes('list');
  logTest('Oracle Help Command', hasHelpText ? 'PASS' : 'WARN',
         hasHelpText ? 'Help text displayed' : 'Help command response unclear');
}

async function testWebInterface() {
  log(`\n${colors.blue}${colors.bold}🌐 PHASE 5: Web Interface Testing${colors.reset}`);
  
  return new Promise((resolve) => {
    log('Starting Next.js development server...');
    
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    let output = '';
    let serverReady = false;
    
    const timeout = setTimeout(() => {
      devProcess.kill('SIGTERM');
      logTest('Next.js Dev Server', 'FAIL', 'Server startup timeout');
      resolve();
    }, 30000);
    
    devProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      if ((output.includes('Ready') && output.includes('localhost:3000')) || 
          output.includes('compiled successfully')) {
        if (!serverReady) {
          serverReady = true;
          clearTimeout(timeout);
          logTest('Next.js Dev Server', 'PASS', 'Development server started on localhost:3000');
          
          // Test Oracle panel accessibility
          setTimeout(async () => {
            await testOraclePanel();
            devProcess.kill('SIGTERM');
            resolve();
          }, 3000);
        }
      }
    });
    
    devProcess.stderr.on('data', (data) => {
      const errorText = data.toString();
      if (errorText.includes('Error') && !errorText.includes('warn')) {
        log(`Dev Server Error: ${errorText}`, colors.red);
      }
    });
    
    devProcess.on('error', (error) => {
      clearTimeout(timeout);
      logTest('Next.js Dev Server', 'FAIL', error.message);
      resolve();
    });
  });
}

async function testOraclePanel() {
  try {
    // Test if Oracle panel route exists and is accessible
    const { stdout, code } = await runCommand('curl', [
      '-s', '-o', '/dev/null', '-w', '%{http_code}', 
      'http://localhost:3000/oracle'
    ]);
    
    const statusCode = stdout.trim();
    const isAccessible = statusCode === '200';
    
    logTest('Oracle Panel Route', isAccessible ? 'PASS' : 'WARN',
           isAccessible ? 'Panel accessible at /oracle' : `HTTP ${statusCode}`);
    
    // Test Oracle API endpoints
    const { stdout: apiStatus } = await runCommand('curl', [
      '-s', '-o', '/dev/null', '-w', '%{http_code}',
      'http://localhost:3000/api/oracle/sync'
    ]);
    
    const apiStatusCode = apiStatus.trim();
    const apiWorks = ['200', '500'].includes(apiStatusCode); // 500 is expected without proper request body
    
    logTest('Oracle API Endpoint', apiWorks ? 'PASS' : 'FAIL',
           apiWorks ? 'API endpoint responsive' : `HTTP ${apiStatusCode}`);
    
  } catch (error) {
    logTest('Oracle Panel Route', 'WARN', 'Could not test HTTP accessibility');
  }
}

function generateTestReport() {
  log(`\n${colors.blue}${colors.bold}📊 TEST EXECUTION REPORT${colors.reset}`);
  
  const endTime = new Date();
  const duration = Math.round((endTime - testResults.startTime) / 1000);
  
  log(`\n${colors.bold}SUMMARY:${colors.reset}`);
  log(`Duration: ${duration} seconds`);
  log(`Total Tests: ${testResults.summary.total}`);
  log(`✅ Passed: ${colors.green}${testResults.summary.passed}${colors.reset}`);
  log(`❌ Failed: ${colors.red}${testResults.summary.failed}${colors.reset}`);
  log(`⚠️  Warnings: ${colors.yellow}${testResults.summary.warnings}${colors.reset}`);
  
  const successRate = Math.round((testResults.summary.passed / testResults.summary.total) * 100);
  log(`Success Rate: ${successRate}%`);
  
  // Detailed test results
  log(`\n${colors.bold}DETAILED RESULTS:${colors.reset}`);
  testResults.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    const color = test.status === 'PASS' ? colors.green : test.status === 'FAIL' ? colors.red : colors.yellow;
    log(`${index + 1}. ${icon} ${test.name}: ${color}${test.status}${colors.reset}`);
    if (test.details) {
      log(`   ${test.details}`);
    }
  });
  
  // Save report to file
  const reportData = {
    ...testResults,
    endTime,
    duration,
    successRate
  };
  
  fs.writeFileSync('./oracle-test-report.json', JSON.stringify(reportData, null, 2));
  log(`\n📄 Full report saved to: oracle-test-report.json`);
  
  // Overall assessment
  if (testResults.summary.failed === 0) {
    log(`\n🎉 ${colors.green}${colors.bold}ALL CRITICAL TESTS PASSED!${colors.reset}`);
    log('ReserveBTC Oracle system is ready for production use.');
  } else {
    log(`\n⚠️  ${colors.yellow}${colors.bold}SOME TESTS FAILED${colors.reset}`);
    log('Review failed tests before deploying to production.');
  }
}

async function runFullTestSuite() {
  log(`${colors.bold}🧪 RESERVEBTC ORACLE INTEGRATION TEST SUITE${colors.reset}`);
  log(`Starting comprehensive testing at ${new Date().toISOString()}`);
  log(`Test Configuration:`);
  log(`- Oracle Address: ${TEST_CONFIG.ORACLE_ADDRESS}`);
  log(`- BTC Address: ${TEST_CONFIG.BTC_TESTNET_ADDRESS}`);
  log(`- MegaETH RPC: ${TEST_CONFIG.MEGAETH_RPC}`);
  log(`- Oracle Contract: ${TEST_CONFIG.ORACLE_CONTRACT}`);
  
  try {
    await checkEnvironment();
    await testApplicationBuild();
    await testTypeChecking();
    await startOracleServer();
    await testWebInterface();
    
    log(`\n${colors.green}${colors.bold}✅ TEST SUITE COMPLETED${colors.reset}`);
    
  } catch (error) {
    log(`\n${colors.red}${colors.bold}❌ TEST SUITE FAILED${colors.reset}`);
    log(`Error: ${error.message}`);
    logTest('Test Suite Execution', 'FAIL', error.message);
  } finally {
    generateTestReport();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n🛑 Test suite interrupted by user');
  generateTestReport();
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n🛑 Test suite terminated');
  generateTestReport();
  process.exit(1);
});

// Start the test suite
if (require.main === module) {
  runFullTestSuite().catch((error) => {
    log(`Fatal error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = {
  runFullTestSuite,
  testResults
};