// Los reglas de eslint deshabilitados tienen un proposito no intenten esto en casa
/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */
import clear from 'clear'
import chalk from 'chalk'
import StandardError from 'standard-error'
import figlet from 'figlet'
import binExists from 'command-exists'
import inquirer from 'inquirer'
import git from 'simple-git/promise'
import { format } from 'date-fns'
import { createBasicAuth } from '@octokit/auth-basic'
import open from 'open'
import ora from 'ora'
import util from 'util'
import fs from 'fs'
import { exec as execSync } from 'child_process'
import { join } from 'path'
import errors from './errors'
import questions from './cli-questions'
import { config, GITHUB_ORGANIZATION, gitActionTypes } from './config'
import clearTheListOfSourceFilesChanged from './utils'

const exec = util.promisify(execSync)
const mkdirAsync = util.promisify(fs.mkdir)
const appendAsync = util.promisify(fs.appendFile)
const writeFileAsync = util.promisify(fs.writeFile)

const LOG = console.log
const spinner = ora()

const isValidStatus = status => {
  return (
    status.not_added.length ||
    status.conflicted.length ||
    status.created.length ||
    status.deleted.length ||
    status.modified.length ||
    status.renamed.length ||
    status.staged.length
  )
}

// eslint-disable-next-line import/prefer-default-export
export async function cli() {
  let currentBranch = null

  try {
    await clear()
    LOG('')
    LOG(chalk.yellow(figlet.textSync('Merge Requester')))

    // Definición de variables
    let githubUsername = null
    let githubPassword = null
    let githubToken = null
    let mergeWithOriginRequired = true
    let conflictsWithOrigin = 0
    let conflictsWithUpstream = 0
    let lastCommitInUpstreamTargetBranch = null
    let openPullRequestNumber = 0
    let newFiles = []
    let pullRequestUri = null
    let pullRequestLocalFolderName = null
    let targetStageBranch = null

    // Verificar si existe el usuario y contraseña
    // configurados en el archivo `.env.github`
    if (!process.env.GITHUB_USER) {
      const { message, ...rest } = errors.GITHUB_AUTH_CONFIG_NOT_USERNAME
      throw new StandardError(message, rest)
    }

    if (!process.env.GITHUB_PASSWORD) {
      const { message, ...rest } = errors.GITHUB_AUTH_CONFIG_NOT_PASSWORD
      throw new StandardError(message, rest)
    }

    githubUsername = process.env.GITHUB_USER
    githubPassword = process.env.GITHUB_PASSWORD
    githubToken = process.env.GITHUB_TOKEN

    try {
      // hub es de github, se tiene que instalar en la maquina, se usa el binario para hacer
      // pull request. Se comprueba que exista
      await binExists('hub')
    } catch (error) {
      const { message, ...rest } = errors.NOT_HUB_BIN
      throw new StandardError(message, rest)
    }

    spinner.text = 'Obteniendo los remotes'
    await spinner.start()
    const { stdout: remotes } = await exec('git remote')
    await spinner.stop()

    if (remotes.indexOf('upstream') === -1) {
      // Tienen que tener configurado el upstream, si no mostrar error ↓
      const { message, ...rest } = errors.NOT_UPSTREAM_REMOTE
      throw new StandardError(message, rest)
    }

    const status = await git().status()

    if (isValidStatus(status)) {
      const { message, ...rest } = errors.CHANGES_NOT_COMMITED
      throw new StandardError(message(status), { ...rest })
    }

    if (!githubToken) {
      try {
        // Se obtiene el token de github para ser utilizado en las demás operacion
        // Esto esta deprecado:
        // OJO: https://developer.github.com/changes/2020-02-14-deprecating-password-auth/
        // La solucion sería que cada usuario cree su github_token y lo guarde en el file .env.github
        const auth = createBasicAuth({
          username: githubUsername,
          password: githubPassword,
          async on2Fa() {
            // prompt user for the one-time password retrieved via SMS or authenticator app
            const { twoFa } = await inquirer.prompt([
              {
                type: 'input',
                name: 'twoFa',
                message: 'Two-factor authentication Code:',
              },
            ])
            return twoFa
          },
          token: {
            note: `Merge Requester command-line tool made for create pull request automatically`,
            scopes: ['repo'],
          },
        })

        const tokenAuthentication = await auth({
          type: 'token',
        })
        githubToken = tokenAuthentication.token
        process.env.GITHUB_TOKEN = githubToken
        await appendAsync(
          join(__dirname, '.env.github'),
          `\nGITHUB_TOKEN=${githubToken}`
        )
      } catch (error) {
        if (error.message.match(/Bad credentials/i)) {
          const { message, ...rest } = errors.GITHUB_BAD_CREDENTIALS
          throw new StandardError(message(error.message), {
            ...rest,
            stack: error.stack,
          })
        } else {
          throw error
        }
      }
    }

    // CLI: seleccione el branch de destino
    const { targetBranch } = await inquirer.prompt(questions.targetBranch)

    // listar todos los branches locales
    const localBranches = await git().branchLocal()

    const targetBranchFound = localBranches.all.findIndex(
      branch => branch === targetBranch
    )

    if (targetBranchFound === -1) {
      // Si no se encontró el branch que seleccionó como destino en la lista de branches localmente, mostrar error
      const { message, ...rest } = errors.NOT_LOCAL_BRANCH_FOUND
      throw new StandardError(message(targetBranch), rest)
    }

    if (
      config[targetBranch] === undefined ||
      config[targetBranch].whitelist === undefined
    ) {
      // si no tiene configuración el branch seleccionado, indico error
      const { message, ...rest } = errors.NOT_WHITELIST_CONFIG_FOUND_FOR_BRANCH
      throw new StandardError(message(targetBranch), rest)
    }

    ;[targetStageBranch] = localBranches.all.filter(
      branch => branch === `${targetBranch}-stage`
    )

    try {
      // listar los Pull Request que están abiertos actualmente para el branch de destino
      // la lista viene en formato: numero del pr|autor del pr|branch del pr salto de línea
      spinner.text = `Obteniendo la lista de Pull Request abiertos y verificando si ${githubUsername} tiene uno abierto para el branch ${targetBranch}`
      await spinner.start()
      const { stdout: listOfOpenPR } = await exec(
        `hub pr list -b ${targetBranch} -f "%I|%au|%B%n"`
      )

      if (listOfOpenPR && listOfOpenPR.length) {
        listOfOpenPR.split('\n').forEach(pr => {
          if (pr) {
            const [number, author] = pr.split('|')
            if (author === process.env.GITHUB_USER) {
              // solo queremos saber los PR creados por el usuario
              openPullRequestNumber = number
            }
          }
        })
      }

      await spinner.stop()
    } catch (error) {
      const { message, ...rest } = errors.LIST_OPENED_PULL_REQUEST
      throw new StandardError(message(error.message), {
        ...rest,
        stack: error.stack,
      })
    }

    // cambiarse al branch de destino para obtener
    // cambios
    try {
      await git().silent(true).checkout(targetBranch)
    } catch (error) {
      const { message, ...rest } = errors.CHECKOUT_TO_TARGET_BRANCH

      throw new StandardError(message({ error: error.message, targetBranch }), {
        ...rest,
        stack: error.stack,
      })
    }

    // Hacer fetch del remote origin del branch elegido como destino
    try {
      spinner.text = `Haciendo fetch de lo últimos cambios en origin/${targetBranch}`
      await spinner.start()
      await git().silent(true).fetch('origin', targetBranch)
      await spinner.stop()
    } catch (error) {
      if (error.message.match(/couldn't find remote ref/i)) {
        // no se encontro el branch en el origin
        // no es necesario hacer merge ya que no existe
        // aún el branch en el origin
        mergeWithOriginRequired = false
      } else {
        const { message, ...rest } = errors.FETCH_FROM_ORIGIN_TARGET_BRANCH
        throw new StandardError(
          message({ error: error.message, targetBranch }),
          { ...rest, stact: error.stack }
        )
      }
    }

    if (mergeWithOriginRequired) {
      try {
        // se hace merge de los cambios que hay en el remote origin del branch de destino seleccionado
        // En caso de conflictos se guardan
        spinner.text = `Realizando merge de los cambios de origin/${targetBranch}`
        await spinner.start()
        const { conflicts } = await git()
          .silent(true)
          .merge([`origin/${targetBranch}`])
        await spinner.stop
        if (conflicts.length) {
          conflictsWithOrigin = conflicts.length
        }
      } catch (error) {
        const { message, ...rest } = errors.MERGE_ORIGIN_TARGET_BRANCH
        throw new StandardError(
          message({
            error: error.message,
            targetBranch,
          }),
          {
            ...rest,
            stack: error.stack,
          }
        )
      }
    }

    // En caso de conflictos luego de realizar los merge de remote origin y upstream del branch de destino seleccionado, se le indica al usuario que los arregle
    if (conflictsWithOrigin > 0) {
      const { message, ...rest } = errors.CONFLICTS_AFTER_MERGE_REMOTES
      throw new StandardError(message(targetBranch), rest)
    }

    // Hacer fetch del remote upstream del branch elegido como destino
    try {
      spinner.text = `Haciendo fetch de lo últimos cambios en upstream/${targetBranch}`
      await spinner.start()
      await git().silent(true).fetch('upstream', targetBranch)
      await spinner.stop()
    } catch (error) {
      if (error.message.match(/couldn't find remote ref/i)) {
        const { message, ...rest } = errors.NOT_UPSTREAM_TARGET_BRANCH
        throw new StandardError(
          message({ error: error.message, targetBranch }),
          { ...rest, stack: error.stack }
        )
      } else {
        const { message, ...rest } = errors.FETCH_FROM_UPSTREAM_TARGET_BRANCH
        throw new StandardError(
          message({ error: error.message, targetBranch }),
          { ...rest, stact: error.stack }
        )
      }
    }

    // se hace merge de los cambios que hay en el remote upstream del branch de destino seleccionado
    // En caso de conflictos se guardan
    try {
      spinner.text = `Realizando merge de los cambios de upstream/${targetBranch}`
      await spinner.start()
      const { conflicts } = await git()
        .silent(true)
        .merge([`upstream/${targetBranch}`])
      await spinner.stop()
      if (conflicts.length) {
        conflictsWithUpstream = conflicts.length
      }
    } catch (error) {
      const { message, ...rest } = errors.MERGE_FROM_UPSTREAM_TARGET_BRANCH
      throw new StandardError(message({ error: error.message, targetBranch }), {
        ...rest,
        stack: error.stack,
      })
    }

    // En caso de conflictos luego de realizar los merge de remote origin y upstream del branch de destino seleccionado, se le indica al usuario que los arregle
    if (conflictsWithUpstream > 0) {
      const { message, ...rest } = errors.CONFLICTS_AFTER_MERGE_REMOTES
      throw new StandardError(message(targetBranch), rest)
    }

    // CLI: seleccione el branch de origen
    const { sourceBranch } = await inquirer.prompt(
      questions.sourceBranch({
        localBranches: localBranches.all.filter(
          branch => !branch.includes('-stage')
        ),
        defaultBranch: localBranches.current,
      })
    )

    const sourceBranchFound = localBranches.all.findIndex(
      branch => branch === sourceBranch
    )

    if (sourceBranchFound === -1) {
      // Si no se encontró el branch, mostrar error
      // esta de más esta validación, pero por aquello
      const { message, ...rest } = errors.NOT_LOCAL_BRANCH_FOUND
      throw new StandardError(message(sourceBranch), rest)
    }

    // se asigna a la variable currentBranch el current branch en local
    currentBranch = localBranches.current

    const filesAndDirectoriesToMerge = config[targetBranch].whitelist.join(' ')

    // hacer el merge de los cambios nuevos del origen
    try {
      spinner.text = `Realizando merge de los cambios del branch local ${sourceBranch} al branch local ${targetBranch}`
      await spinner.start()
      const { conflicts } = await git().silent(true).merge([sourceBranch])
      await spinner.stop()
      if (conflicts > 0) {
        throw new Error('CONFLICTS')
      }
    } catch (error) {
      if (error.message === 'CONFLICTS') {
        const { message, ...rest } = errors.MERGE_FROM_SOURCE_CONFLICTS
        throw new StandardError(
          message({ error: error.message, sourceBranch }),
          rest
        )
      } else {
        const { message, ...rest } = errors.MERGE_FROM_SOURCE
        throw new StandardError(
          message({ error: error.message, sourceBranch }),
          rest
        )
      }
    }

    // diferencias entre destino y upstream destinos pero solo ciertos archivos
    spinner.text = 'Obteniendo las diferencias entre branches'
    await spinner.start()
    let branch1 = targetBranch
    let branch2 = `upstream/${targetBranch}`
    // si hay un pull request abierto se compara branch destino local contra
    // branch destino en origin, sino se compara branch destino local contra
    // branch destino en upstream
    if (openPullRequestNumber) {
      branch1 = targetBranch
      branch2 = `origin/${targetBranch}`
    }

    const { stdout: differencesBetweenBranches } = await exec(
      `git diff ${branch1}..${branch2} --color --stat ${filesAndDirectoriesToMerge}`
    )
    await spinner.stop()

    if (!differencesBetweenBranches) {
      // no hay cambios en los fuentes, nada para
      // el deploy
      const { message, ...rest } = errors.NOT_CHANGES_FOUND
      throw new StandardError(message({ sourceBranch, targetBranch }), rest)
    }

    // Mostrar los fuentes cambiados y preguntar
    // si quiere avanzar
    LOG('\n\n')
    LOG(differencesBetweenBranches)
    const { confirmDifferencesBetweenBranches } = await inquirer.prompt(
      questions.confirmDifferencesBetweenBranches({
        targetBranch,
        sourceBranch,
      })
    )

    if (!confirmDifferencesBetweenBranches) {
      // no quiere avanzar o no confirma los cambios
      process.exit(0)
      return
    }

    // guardo el último commit SHA antes de hacer merge
    // para luego hacer la comparación de diferencias entre branches
    const { branches } = await git().branch()
    lastCommitInUpstreamTargetBranch =
      branches[`remotes/upstream/${targetBranch}`].commit

    try {
      if (!targetStageBranch) {
        // crear el branch de stage si no existe basado en upstream/targetbranch
        targetStageBranch = `${targetBranch}-stage`
        await git().checkout([
          '-b',
          targetStageBranch,
          `upstream/${targetBranch}`,
        ])
      } else {
        // pasarse al branch de stage si existe
        await git().checkout(targetStageBranch)
      }
    } catch (error) {
      const { message, ...rest } = errors.CHECKOUT_TARGET_STAGE_BRANCH
      throw new StandardError(
        message(
          { error: error.message, targetStageBranch },
          { ...rest, stack: error.stack }
        )
      )
    }

    // hacer el merge de los cambios nuevos del origen
    try {
      spinner.text = `Realizando merge de los cambios del branch local ${sourceBranch} al branch local ${targetStageBranch}`
      await spinner.start()
      // el checkout cuando se le pasa otro argumento es como un merge
      await exec(`git checkout ${targetBranch} ${filesAndDirectoriesToMerge}`)
      await spinner.stop()
    } catch (error) {
      const { message, ...rest } = errors.MERGE_FROM_SOURCE
      throw new StandardError(
        message({ error: error.message, sourceBranch }),
        rest
      )
    }

    // se hace commit de los cambios del merge del paso anterior
    try {
      spinner.text = 'Realizando commit de los cambios'
      await spinner.start()
      await git().add('.')
      await git().commit(
        'feat(merge-requester): se hace commit de cambios para preparar pull-request',
        { '--no-verify': null }
      )
      await spinner.stop()
    } catch (error) {
      const { message, ...rest } = errors.MERGE_CHANGES_FROM_ORIGIN_UPSTREAM
      throw new StandardError(message, rest)
    }

    // Realizar push de los cambios a los branch de destino en el remote de origin
    // Mae esto pronto no va a servir(usar username:password), jeje, OJO: https://developer.github.com/changes/2020-02-14-deprecating-password-auth/
    // considerar usar los remotes por ssh ó octokit
    try {
      spinner.text = `Realizando push de los cambios al origin ${targetBranch} y ${targetStageBranch}`
      await spinner.start()
      await Promise.all([
        git().silent(true).push('origin', `${targetBranch}:${targetBranch}`),
        git().silent(true).push('origin', targetStageBranch),
      ])
      await spinner.stop()
    } catch (error) {
      const { message, ...rest } = errors.PUSH_TO_ORIGIN_TARGET_BRANCH
      throw new StandardError(message({ targetBranch, error }), {
        ...rest,
        stack: error.stack,
      })
    }

    // Esto se podría mejorar manejando en alguna BD los datos de los PR
    // de momento se guarda la informacion en archivos, por facilidad y tiempo
    // CONS: no se podría actualizar la info de un PR abierto desde otra maquina
    if (openPullRequestNumber) {
      // se obtienen los archivos anteriormente agregados en un PR activo
      const { stdout: currentPR } = await exec(
        `hub pr show -u ${openPullRequestNumber}`
      )

      pullRequestUri = currentPR
      pullRequestLocalFolderName = `pr${openPullRequestNumber}`
    } else {
      // se crea el Pull Request en Github
      // Flags a tomar en cuenta
      // -m: título del branch
      // -b: branch destino
      // -r: reviewers
      // -l: labels/tags
      // -h: head branch
      let actionToExecute = `hub pull-request -f -m "New Pull Request by ${githubUsername}" -h ${githubUsername}:${targetStageBranch} -b ${GITHUB_ORGANIZATION}:${targetBranch}`

      const configuration = config[targetBranch]

      if (configuration.reviewers && configuration.reviewers.length) {
        const reviewers = configuration.reviewers
          .filter(r => r.toLowerCase() !== githubUsername.toLowerCase())
          .join(',')
        if (reviewers && reviewers.length) {
          actionToExecute += ` -r ${reviewers}`
        }
      }

      if (configuration.labels && configuration.labels.length) {
        actionToExecute += ` -l ${configuration.labels.join(',')}`
      }

      try {
        spinner.text = `Creando el Pull Request`
        await spinner.start()
        const { stdout: pullRequestCreated } = await exec(actionToExecute)
        openPullRequestNumber = pullRequestCreated.substring(
          pullRequestCreated.lastIndexOf('/') + 1
        )
        openPullRequestNumber = openPullRequestNumber.replace('\n', '')
        await spinner.stop()

        pullRequestUri = pullRequestCreated
      } catch (error) {
        const { message, ...rest } = errors.CREATING_PULL_REQUEST
        throw new StandardError(
          message({ targetBranch, error: error.message }),
          { ...rest, stack: error.stack }
        )
      }

      try {
        //  crear carpeta con la información del Pull Request, es temporal
        pullRequestLocalFolderName = `pr${openPullRequestNumber}`
        await mkdirAsync(join(__dirname, pullRequestLocalFolderName))
      } catch (error) {
        const { message, ...rest } = errors.CREATING_PULL_REQUEST_LOCAL_FOLDER
        throw new StandardError(message(error.message), {
          ...rest,
          stack: error.stack,
        })
      }

      try {
        const { steps, pm2 } = config[targetBranch]
        await Promise.all([
          writeFileAsync(
            join(__dirname, pullRequestLocalFolderName, 'README.txt'),
            'No tocar los archivos que hay en esta carpeta\nBorrar esta carpeta luego de que el pull request haya sido mergeado'
          ),
          writeFileAsync(
            join(__dirname, pullRequestLocalFolderName, 'INSTRUCTIONS.txt'),
            `Precondiciones de instalación:\n${steps.preconditions.replace(
              ':pullRequestUri',
              pullRequestUri
            )}\n\nPasos de instalación:\n${steps.installation
              .replace(':path', pm2.path)
              .replace(':branch', targetBranch)
              .replace(
                ':executionScript',
                pm2.executionScript
              )}\n\nPasos de verificación:\n${steps.verification.replace(
              /:name/g,
              pm2.name
            )}\n\nPasos de rollback:\n${steps.rollback
              .replace(':lastCommitSHA', lastCommitInUpstreamTargetBranch)
              .replace(':name', pm2.name)}\n\nLista de fuentes cambiados:\n`
          ),
        ])
      } catch (error) {
        const { message, ...rest } = errors.CREATING_INFO_PULL_REQUEST_FILES
        throw new StandardError(message(error.message), {
          ...rest,
          stack: error.stack,
        })
      }
    }

    // el diff respondería algo como: M README.md
    // En donde M es la acción que ocurrió (Crear, Modificar, etc), basicamente gitActionTypes tiene mapeadas todas las acciones para que lo tome como referencia
    const { stdout: diff } = await exec(
      `git diff upstream/${targetBranch} ${targetStageBranch} --name-status`
    )

    if (diff && diff.length) {
      const today = new Date()

      newFiles = diff.split('\n').reduce(
        (acc, currentValue, count) => {
          if (currentValue && currentValue.length) {
            const [action, file] = currentValue.split('\t') // \t es un espacio
            acc.files.push(file)
            acc.instructions.push(
              `${file},${
                gitActionTypes[action.toLowerCase()]
              } ${file},1,${format(today, 'dd-MM-yyyy')},Objeto,Objeto`
            )

            if (count === 19) {
              acc.instructions.push('')
            }
          }

          return acc
        },
        { files: [], instructions: [] }
      )

      if (openPullRequestNumber) {
        await clearTheListOfSourceFilesChanged(openPullRequestNumber)
      }

      await appendAsync(
        join(__dirname, pullRequestLocalFolderName, 'INSTRUCTIONS.txt'),
        `\n${newFiles.instructions.join('\n')}`
      )

      await writeFileAsync(
        join(__dirname, pullRequestLocalFolderName, 'files.js'),
        `module.exports = [${newFiles.files.map(i => `'${i}'`).join(', ')}]`
      )
    }

    await open(pullRequestUri.replace('\n', ''))

    await git().checkout(currentBranch)
  } catch (error) {
    if (!error.conserveBranch) {
      await git().checkout(currentBranch)
    }
    if (error && error.status) {
      LOG(error.message)
    } else {
      console.error(error)
    }
  } finally {
    spinner.stop()
  }
}
