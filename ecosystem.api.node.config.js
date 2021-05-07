module.exports = {
  apps: [
    {
      name: 'auth-api',
      script: './services/api/index.js',
      watch: false,
      time: true,
      env: {
        NODE_ENV: 'development',
      },
      env_dev: {
        NODE_ENV: 'production',
        ENV_VARS: 'dev',
      },
      env_qa: {
        NODE_ENV: 'production',
        ENV_VARS: 'qa',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
