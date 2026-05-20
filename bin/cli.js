#!/usr/bin/env node

import { program, Option } from 'commander'
import { organizeCommand } from '../src/commands/organize.js'

program
  .name('audex')
  .description('Audiobook Organizer')
  .version('1.0.0')
  .requiredOption('-i, --input <dir>', 'input directory to scan')
  .requiredOption('-o, --output <dir>', 'output directory for organized files')
  .addOption(new Option('-p, --provider <provider>', 'metadata provider').choices(['Audible', 'GoogleBooks', 'iTunes']).default('Audible'))
  .addOption(
    new Option('-l, --log-level <level>', 'log level').choices(['error', 'warn', 'info', 'http', 'verbose', 'debug']).default('info')
  )

program
  .command('organize')
  .description('Scan the input directory for audiobooks')
  .action(() => organizeCommand(program.opts()))

program.parse()
