#!/usr/bin/env node
/**
 * CLI entry point for llm-seo.
 * Main entry point for the `llm-seo` command line tool.
 * 
 * Commands:
 * - generate: Generate llms.txt and llms-full.txt from config
 * - check: Validate generated files against config
 * - doctor: Diagnose common issues with llm-seo setup
 */

import { Command } from 'commander';
import { ExitCodes } from './exit-codes.js';

// Import version from package.json
const VERSION = '0.1.0';

const program = new Command();

program
  .name('llm-seo')
  .description('Deterministic LLM SEO artifacts generator and validator for modern static sites')
  .version(VERSION)
  .option('-c, --config <path>', 'Path to config file', 'llm-seo.config.ts')
  .option('-v, --verbose', 'Enable verbose output', false);

// ========================================
// Generate Command
// ========================================
program
  .command('generate')
  .description('Generate llms.txt and llms-full.txt from site configuration')
  .option('-c, --config <path>', 'Path to config file')
  .option('--dry-run', 'Output to stdout instead of writing files', false)
  .option('--emit-citations', 'Generate citations.json file', false)
  .option('-v, --verbose', 'Show detailed progress', false)
  .action(async (options) => {
    const { generateCommand } = await import('./commands/generate.js');
    const exitCode = await generateCommand({
      config: options.config ?? program.opts().config,
      dryRun: options.dryRun ?? false,
      emitCitations: options.emitCitations ?? false,
      verbose: options.verbose ?? program.opts().verbose ?? false,
    });
    process.exit(exitCode);
  });

// ========================================
// Check Command
// ========================================
program
  .command('check')
  .description('Validate generated llms.txt files against configuration')
  .option('-c, --config <path>', 'Path to config file')
  .option('--fail-on <level>', 'Fail on warnings (warn) or only errors (error)', 'error')
  .option('--check-live', 'Check machine hint URLs (robots/sitemap/llms) over HTTP', false)
  .option('--check-machine-hints-live', 'Deprecated alias for --check-live', false)
  .option('--timeout-ms <ms>', 'HTTP timeout for live checks in milliseconds', '10000')
  .option('--retries <count>', 'Retry count for live checks', '0')
  .option('--emit-report <path>', 'Write JSON report to path')
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (options) => {
    const { checkCommand } = await import('./commands/check.js');
    
    // Validate fail-on option
    const failOn = options.failOn as 'warn' | 'error';
    if (failOn !== 'warn' && failOn !== 'error') {
      console.error(`Invalid --fail-on value: ${options.failOn}. Must be 'warn' or 'error'.`);
      process.exit(ExitCodes.ERROR);
    }
    
    const exitCode = await checkCommand({
      config: options.config ?? program.opts().config,
      failOn,
      checkLive: Boolean(options.checkLive ?? options.checkMachineHintsLive ?? false),
      timeoutMs: Number.parseInt(String(options.timeoutMs ?? '10000'), 10) || 10000,
      retries: Number.parseInt(String(options.retries ?? '0'), 10) || 0,
      emitReportPath: options.emitReport,
      verbose: options.verbose ?? program.opts().verbose ?? false,
    });
    process.exit(exitCode);
  });

// ========================================
// Doctor Command
// ========================================
program
  .command('doctor')
  .description('Diagnose common issues with llm-seo setup and site endpoints')
  .option('-s, --site <url>', 'Site URL to check (e.g., https://example.com)')
  .option('-c, --config <path>', 'Path to config file')
  .option('-v, --verbose', 'Show detailed output', false)
  .action(async (options) => {
    const { doctorCommand } = await import('./commands/doctor.js');
    const exitCode = await doctorCommand({
      site: options.site,
      config: options.config ?? program.opts().config,
      verbose: options.verbose ?? program.opts().verbose ?? false,
    });
    process.exit(exitCode);
  });

// ========================================
// Help Command (custom)
// ========================================
program
  .command('help [command]')
  .description('Display help for a specific command')
  .action((commandName) => {
    if (commandName) {
      const command = program.commands.find((cmd) => cmd.name() === commandName);
      if (command) {
        command.outputHelp();
      } else {
        console.error(`Unknown command: ${commandName}`);
        process.exit(ExitCodes.COMMAND_NOT_FOUND);
      }
    } else {
      program.outputHelp();
    }
  });

// ========================================
// Error handling
// ========================================

// Handle unknown commands
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(ExitCodes.COMMAND_NOT_FOUND);
});

// Parse arguments and run
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
