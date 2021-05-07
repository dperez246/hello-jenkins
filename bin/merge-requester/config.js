const commons = {
  files: [
    '.commitlintrc.js',
    '.eslintignore',
    '.eslintrc.js',
    '.gitignore',
    '.lintstagedrc',
    '.prettierignore',
    '.prettierrc',
    'bin/merge-requester',
    'CONTRIBUTING.md',
    'ecosystem.api.node.config.js',
    'Jenkinsfile',
    'lerna.json',
    'package.json',
    'README.md',
    'yarn.lock',
  ],

  preconditions:
    '1- Aceptar y mergear el Pull Request siguiente: :pullRequestUri\n2- Tener yarn instalado:\n   $ yarn --version\n3- Tener git instalado:\n   $ git --version\n4- Tener nodejs instalado:\n   $ node --version\n5- Tener pm2 instalado:\n   $ pm2 --version\n',
  installation:
    '1- Estar en el directorio raíz del paquete:\n   $ cd :path\n2- Obtener los últimos cambios de github:\n    $ git pull origin :branch\n3- Instalar los paquetes de node necesarios:\n    $ yarn install\n4- Ejecutar el launch script:\n    $ :executionScript\n5- Ejecutar el siguiente comando:\n    $ pm2 update',
  verification:
    '1- Listar los procesos que están activos en pm2:\n    $ pm2 list\n2- De la tabla/lista que de se despliega, verificar que exista un ítem con el nombre :name\n3- Verificar que en la lista/tabla el ítem con el nombre :name el campo status no indique error\n4- Verificar que no exista ningún error reciente en los logs de pm2:\n    $ pm2 logs :name --lines 100',
  rollback:
    '1- Hacer checkout al commit anterior:\n    $ git checkout :lastCommitSHA\n2- Reiniciar pm2:\n    $ pm2 restart :name',
}

/**
 * whitelist: se deben indicar las rutas de los archivos y/o
 * folders a ser tomados en cuenta para el merge del branch de origen
 * al branch de destino. Por ejemplo si en la lista dice ['folder1/']
 * cuándo haga el merge, al destino solo se va mergear los cambios en
 * folder1 aunque exista un folder2 y se le hayan hecho cambios.
 * utilice . para incluir todos los files
 * reviewers: los reviewer son las personas por defecto asignadas
 * para que revisen el Pull Request y lo aprueben.
 * labels: los labels son la lista de tags con las
 * que quiere etiquetar el Pull Request
 * pm2: información que respecta a pm2
 * steps: pasos de instalación
 */
export const config = {
  'dgme-apis/qa': {
    whitelist: [
      ...commons.files,
      'packages/db',
      'packages/locales',
      'packages/policies',
      'packages/utils',
      'packages/vars',
      'services/api',
    ],
    reviewers: ['DarkJ24', 'rm-soin'],
    labels: ['API', 'QA'],
    pm2: {
      name: 'auth-api',
      path: '/home/labs/tramite-ya/TramiteYa-Notifications/NotificationsAPI',
      executionScript: 'yarn start:api:dgme-qa',
    },
    steps: {
      preconditions: commons.preconditions,
      installation: commons.installation,
      verification: commons.verification,
      rollback: commons.rollback,
    },
  },
  'dgme-apis/master': {
    whitelist: [
      ...commons.files,
      'packages/db',
      'packages/locales',
      'packages/policies',
      'packages/utils',
      'packages/vars',
      'services/api',
    ],
    reviewers: ['mistermaik', 'rm-soin'],
    labels: ['API', 'PROD'],
    pm2: {
      name: 'auth-api',
      path:
        '/mnt/nfs/app/Tramite-YA/TramiteYa-Notifications-Prd/NotificationsAPI',
      executionScript: 'yarn start:api:dgme-master',
    },
    steps: {
      preconditions: commons.preconditions,
      installation: commons.installation,
      verification: commons.verification,
      rollback: commons.rollback,
    },
  },
}

export const branches = Object.keys(config).map(branch => branch)

export const REPO = 'NotificationsAPI.git'

export const GITHUB_ORGANIZATION = 'SoinLabs'

export const gitActionTypes = {
  a: 'Se agregó el archivo',
  c: 'Se copió el archivo',
  d: 'Se eliminó el archivo',
  m: 'Se modificó el archivo',
  r: 'Se renombró el archivo',
}
