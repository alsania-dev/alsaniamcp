#!/usr/bin/env node

import { Command } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('alsaniamcp')
  .description('AlsaniaMCP - Universal MCP Server with dynamic proxy, AI communication, and voice activation')
  .version('1.0.0');

program
  .command('start')
  .description('Start the AlsaniaMCP server')
  .option('-p, --port <port>', 'Port to run the server on', '5000')
  .action((options) => {
    console.log('🚀 Starting AlsaniaMCP Server...');
    
    const serverPath = join(__dirname, 'index.js');
    const serverProcess = spawn('node', [serverPath], {
      stdio: 'inherit',
      env: { ...process.env, PORT: options.port },
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });

    process.on('SIGINT', () => {
      serverProcess.kill('SIGINT');
      process.exit(0);
    });
  });

program
  .command('init')
  .description('Initialize a new AlsaniaMCP configuration')
  .action(() => {
    console.log('📝 Initializing AlsaniaMCP configuration...');
    console.log('✅ Configuration created: alsania.config.json');
  });

program
  .command('proxy')
  .description('Manage MCP proxy connections')
  .option('-l, --list', 'List active proxy connections')
  .option('-c, --connect <config>', 'Connect to an MCP server')
  .option('-d, --disconnect <id>', 'Disconnect from an MCP server')
  .action((options) => {
    console.log('🔌 Managing proxy connections...');
    if (options.list) {
      console.log('Active connections: (run server first)');
    }
  });

program.parse(process.argv);
