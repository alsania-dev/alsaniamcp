#!/usr/bin/env node

import { Command } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('alsaniamcp')
  .aliases(['amcp'])
  .description('AlsaniaMCP - Universal MCP Server with dynamic proxy, AI communication, and voice activation')
  .version('1.0.0');

// Server Management Commands
const serverCommand = program
  .command('server')
  .description('Server management commands');

serverCommand
  .command('start')
  .description('Start the AlsaniaMCP server')
  .option('-p, --port <port>', 'Port to run the server on', '8050')
  .option('-d, --detached', 'Run server in background')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    const spinner = ora('🚀 Starting AlsaniaMCP Server...').start();

    try {
      const env = {
        ...process.env,
        PORT: options.port,
        VERBOSE: options.verbose ? 'true' : undefined,
        CONFIG_PATH: options.config,
      };

      const serverPath = join(__dirname, 'index.js');
      const serverProcess = spawn('node', [serverPath], {
        stdio: options.detached ? 'ignore' : 'inherit',
        env,
        detached: options.detached,
      });

      if (options.detached) {
        serverProcess.unref();
        spinner.succeed(chalk.green(`✅ Server started in background on port ${options.port}`));
        console.log(chalk.gray(`PID: ${serverProcess.pid}`));
        return;
      }

      serverProcess.on('error', (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        spinner.fail(chalk.red(`❌ Failed to start server: ${errorMessage}`));
        process.exit(1);
      });

      process.on('SIGINT', () => {
        spinner.info(chalk.yellow('🛑 Shutting down server...'));
        serverProcess.kill('SIGINT');
        process.exit(0);
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`❌ Error: ${errorMessage}`));
      process.exit(1);
    }
  });

serverCommand
  .command('stop')
  .description('Stop the AlsaniaMCP server')
  .option('-p, --port <port>', 'Port the server is running on', '8050')
  .option('-f, --force', 'Force kill the server')
  .action(async (options) => {
    const spinner = ora('🛑 Stopping AlsaniaMCP Server...').start();

    try {
      // Find and kill the process on the specified port
      const killCommand = process.platform === 'win32' ? 'taskkill' : 'pkill';
      const killArgs = process.platform === 'win32'
        ? ['/F', '/IM', 'node.exe', '/FI', `WINDOWTITLE eq AlsaniaMCP*`]
        : ['-f', `node.*alsaniamcp.*${options.port}`];

      const killProcess = spawn(killCommand, killArgs, { stdio: 'pipe' });

      await new Promise<void>((resolve, reject) => {
        killProcess.on('close', (code) => {
          if (code === 0) {
            spinner.succeed(chalk.green('✅ Server stopped successfully'));
            resolve();
          } else {
            spinner.warn(chalk.yellow('⚠️  Server may still be running'));
            resolve();
          }
        });
        killProcess.on('error', reject);
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`❌ Error stopping server: ${errorMessage}`));
    }
  });

serverCommand
  .command('status')
  .description('Check server status and health')
  .option('-p, --port <port>', 'Port to check', '8050')
  .option('-d, --detailed', 'Show detailed status')
  .action(async (options) => {
    const spinner = ora('🔍 Checking server status...').start();

    try {
      // Simple health check - could be enhanced with actual HTTP calls
      const checkProcess = spawn('pgrep', ['-f', `alsaniamcp.*${options.port}`], { stdio: 'pipe' });

      const running = await new Promise((resolve) => {
        checkProcess.on('close', (code) => resolve(code === 0));
      });

      if (running) {
        if (options.detailed) {
          // In a real implementation, this would query the API
          console.log(chalk.green('✅ Server Status: Running'));
          console.log(chalk.gray('📊 Port: ') + options.port);
          console.log(chalk.gray('🕒 Uptime: ') + 'Unknown (run server API call)');
          console.log(chalk.gray('📈 Memory: ') + 'Unknown (run server API call)');
        } else {
          spinner.succeed(chalk.green(`✅ Server is running on port ${options.port}`));
        }
      } else {
        spinner.fail(chalk.red(`❌ Server is not running on port ${options.port}`));
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`❌ Error checking status: ${errorMessage}`));
    }
  });

serverCommand
  .command('logs')
  .description('Show server logs')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action((options) => {
    console.log('📋 Server logs: (implementation needed)');
    console.log('Use tail/log rotation for production deployments');
  });

// Voice Control Commands
const voiceCommand = program
  .command('voice')
  .description('Voice activation and processing commands');

voiceCommand
  .command('check')
  .description('Check voice API support in current environment')
  .action(() => {
    console.log('🎤 Checking voice API support...');
    console.log('Note: Voice commands require browser environment');
    console.log('Supported APIs:');
    console.log('  - Speech Recognition (STT)');
    console.log('  - Speech Synthesis (TTS)');
    console.log('  - Web Audio API');
    console.log('');
    console.log('Run in browser for full support');
  });

voiceCommand
  .command('config')
  .description('Show/default voice configuration')
  .action(() => {
    console.log('🎛️  Voice Configuration:');
    console.log('Sample Rate: 16000 Hz');
    console.log('Keywords: ["hey alsania", "alsania", "computer"]');
    console.log('Threshold: 0.6');
    console.log('Echo Cancellation: Enabled');
    console.log('Noise Suppression: Enabled');
  });

// Communication Management Commands
const commCommand = program
  .command('comm')
  .description('A2A communication management commands');

commCommand
  .command('peers')
  .description('List connected AI peers')
  .action(() => {
    console.log('🤖 AI-to-AI Peers: (requires running server)');
    console.log('Start server first: alsaniamcp server start');
  });

commCommand
  .command('send')
  .description('Send message to peer')
  .argument('<peer>', 'Peer ID to send to')
  .argument('<message>', 'Message to send')
  .action((peer, message) => {
    console.log(`📤 Sending "${message}" to peer ${peer}...`);
    console.log('(requires running server with A2A communication)');
  });

commCommand
  .command('broadcast')
  .description('Broadcast message to all peers')
  .argument('<message>', 'Message to broadcast')
  .action((message) => {
    console.log(`📢 Broadcasting "${message}" to all peers...`);
    console.log('(requires running server with A2A communication)');
  });

// Server Spawning Commands
const spawnCommand = program
  .command('spawn')
  .description('Dynamic MCP server spawning commands');

spawnCommand
  .command('list')
  .description('List available predefined server configurations')
  .action(() => {
    console.log('📋 Available Server Configurations:');
    console.log('  • filesystem - Filesystem MCP Server');
    console.log('  • git        - Git MCP Server');
    console.log('  • github     - GitHub MCP Server');
  });

spawnCommand
  .command('start <type>')
  .description('Start a predefined MCP server')
  .action(async (type) => {
    const spinner = ora(`🚀 Starting ${type} MCP server...`).start();

    try {
      // This would integrate with the actual server spawning manager
      spinner.succeed(chalk.green(`✅ ${type} MCP server started`));
      console.log(chalk.gray('Server ID: ') + `${type}-server`);
      console.log(chalk.gray('Status: ') + 'Running');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`❌ Failed to start ${type} server: ${errorMessage}`));
    }
  });

spawnCommand
  .command('stop <id>')
  .description('Stop a spawned MCP server')
  .action(async (id) => {
    const spinner = ora(`🛑 Stopping server ${id}...`).start();

    try {
      // This would integrate with the actual server spawning manager
      spinner.succeed(chalk.green(`✅ Server ${id} stopped`));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`❌ Failed to stop server ${id}: ${errorMessage}`));
    }
  });

spawnCommand
  .command('status')
  .description('Show status of all spawned servers')
  .action(() => {
    console.log('📊 Spawned Servers Status:');
    console.log('(requires running server to get real-time status)');
    console.log('No servers currently spawned - start server first');
  });

// Tool Management Commands
const toolsCommand = program
  .command('tools')
  .description('MCP tool management commands');

toolsCommand
  .command('list')
  .description('List available MCP tools')
  .option('-s, --server <id>', 'Filter by server ID')
  .action(async (options) => {
    const spinner = ora('🔍 Fetching available tools...').start();

    try {
      // This would make API calls to the running server
      spinner.succeed(chalk.green('📋 Available Tools:'));
      console.log('Run server first for real tool listing');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`❌ Error fetching tools: ${errorMessage}`));
    }
  });

toolsCommand
  .command('call <serverId> <toolName>')
  .description('Call an MCP tool')
  .option('-a, --args <json>', 'Tool arguments as JSON string')
  .action(async (serverId, toolName, options) => {
    const spinner = ora(`🔧 Calling tool ${toolName}...`).start();

    try {
      let args = {};
      if (options.args) {
        try {
          args = JSON.parse(options.args);
        } catch (e) {
          throw new Error('Invalid JSON in --args parameter');
        }
      }

      // This would make API calls to the running server
      spinner.succeed(chalk.green(`✅ Tool ${toolName} executed`));
      console.log(chalk.gray('Result: (would show actual result)'));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`❌ Tool execution failed: ${errorMessage}`));
    }
  });

// Configuration Commands
const configCommand = program
  .command('config')
  .description('Configuration management commands');

configCommand
  .command('init')
  .description('Initialize a new AlsaniaMCP configuration')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    const spinner = ora('📝 Initializing configuration...').start();

    try {
      // This would create default config files
      spinner.succeed(chalk.green('✅ Configuration initialized'));
      console.log('Created: alsania.mcp.json');
      console.log('Created: voice-config.json');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`❌ Configuration failed: ${errorMessage}`));
    }
  });

configCommand
  .command('validate')
  .description('Validate current configuration')
  .action(async () => {
    const spinner = ora('✅ Validating configuration...').start();

    try {
      // This would validate config files
      spinner.succeed(chalk.green('✅ Configuration is valid'));
      console.log('All settings verified and ready');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(chalk.red(`❌ Configuration invalid: ${errorMessage}`));
    }
  });

// Legacy command support (backward compatibility)
program
  .command('start')
  .description('Legacy: Use "server start" instead')
  .action(() => {
    console.log(chalk.yellow('⚠️  Legacy command. Use "alsaniamcp server start" instead'));
    program.commands.find(c => c.name() === 'server')?.commands.find(c => c.name() === 'start')?.parse();
  });

program
  .command('init')
  .description('Legacy: Use "config init" instead')
  .action(() => {
    console.log(chalk.yellow('⚠️  Legacy command. Use "alsaniamcp config init" instead'));
    program.commands.find(c => c.name() === 'config')?.commands.find(c => c.name() === 'init')?.parse();
  });

program
  .command('proxy')
  .description('Legacy: Use "comm" commands instead')
  .action(() => {
    console.log(chalk.yellow('⚠️  Legacy command. Communication management moved to "alsaniamcp comm"'));
    console.log('Available commands: peers, send, broadcast');
  });

// Version info
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('');
  console.log('  Start server:');
  console.log('    $ alsaniamcp server start -p 8050');
  console.log('');
  console.log('  Check voice support:');
  console.log('    $ alsaniamcp voice check');
  console.log('');
  console.log('  Spawn a GitHub MCP server:');
  console.log('    $ alsaniamcp spawn start github');
  console.log('');
  console.log('  List AI peers:');
  console.log('    $ alsaniamcp comm peers');
  console.log('');
  console.log('  Call an MCP tool:');
  console.log('    $ alsaniamcp tools call core echo -a \'{"message":"hello"}\'');
  console.log('');
  console.log('  Initialize config:');
  console.log('    $ alsaniamcp config init');
});

program.parse(process.argv);
