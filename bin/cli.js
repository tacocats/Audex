#!/usr/bin/env node

import { program } from 'commander';

program
  .name('audex')
  .description('Audiobook Organizer')
  .version('1.0.0')
  .requiredOption('-i, --input <dir>', 'input directory to scan');

program
  .command('scan')
  .description('Scan the input directory for audiobooks')
  .action(() => {
    const { input } = program.opts();
    console.log(`Scanning: ${input}`);
  });

program.parse();
