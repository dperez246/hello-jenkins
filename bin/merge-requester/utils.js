import fs from 'fs'
import { Transform } from 'stream'
import { join } from 'path'

function clipLines() {
  const transform = new Transform({
    transform(chunk, enconding, callback) {
      const lines = chunk.toString('utf8').split('\n')
      const chunks = []
      for (let line = 0; line < lines.length; line++) {
        chunks.push(Buffer.from(lines[line]))
        chunks.push(Buffer.from('\n'))
        if (lines[line] === 'Lista de fuentes cambiados:') {
          break
        }
      }

      callback(null, Buffer.concat(chunks))
    },
  })

  return transform
}

export default function clearTheListOfSourceFilesChanged(pullRequestNumber) {
  return new Promise((resolve, reject) => {
    const path = join(__dirname, `pr${pullRequestNumber}`)
    const write = fs.createWriteStream(join(path, 'INSTRUCTIONS-new.txt'), {
      flags: 'w',
    })

    const read = fs
      .createReadStream(join(path, 'INSTRUCTIONS.txt'))
      .pipe(clipLines())
      .pipe(write)

    write.on('finish', () => {
      fs.unlinkSync(join(path, 'INSTRUCTIONS.txt'))
      fs.renameSync(
        join(path, 'INSTRUCTIONS-new.txt'),
        join(path, 'INSTRUCTIONS.txt')
      )
      write.end()
      read.end()
      resolve()
    })
    write.on('error', reject)
  })
}
