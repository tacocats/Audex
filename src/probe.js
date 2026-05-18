// Extracts embedded metadata tags (title, author, narrator, etc.) from audio files via ffprobe
import { execFile } from 'child_process'
import logger from './logger.js'

export async function probeFiles(filePaths) {
  return Promise.all(filePaths.map(probeFile))
}

function probeFile(filePath) {
  return new Promise((resolve) => {
    execFile('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_format', filePath], (err, stdout) => {
      if (err) {
        logger.debug(`Probe failed: ${filePath}: ${err.message}`)
        resolve({ filePath, tags: null })
        return
      }
      const tags = JSON.parse(stdout).format?.tags ?? {}
      logger.debug(`Probed: ${filePath}`)
      resolve({ filePath, tags })
    })
  })
}
