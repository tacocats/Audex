# Audex

[![npm version](https://img.shields.io/npm/v/@tacocats/audex)](https://www.npmjs.com/package/@tacocats/audex)

Organize your audibook libraries following the Audiobookshelf directory structure 

## Installing

```
npm install -g @tacocats/audex
```

## Usage

```
Usage: audex [options] [command]

Audiobook Organizer

Options:
  -V, --version              output the version number
  -i, --input <dir>          input directory to scan
  -o, --output <dir>         output directory for organized files
  -p, --provider <provider>  metadata provider (choices: "Audible", "GoogleBooks", "iTunes", default: "Audible")
  -l, --log-level <level>    log level (choices: "error", "warn", "info", "http", "verbose", "debug", default: "info")
  -h, --help                 display help for command

Commands:
  organize                   Scan the input directory for audiobooks
  help [command]             display help for command
```

```
audex organize -i /mnt/storage/Audiobooks -o /mnt/storage/test
```

## Development run
```
npm run start -- organize -i /mnt/storage/Audiobooks -o /mnt/storage/test
```

## Goals
- Organize audiobooks in a directory structure compatible with Audiobookshelf https://www.audiobookshelf.org/docs#book-directory-structure
- Implement NFOStandard for audiobook metadata - https://github.com/Biztactix/NFOStandard
