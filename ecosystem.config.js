module.exports = {
  apps: [{
    name: 'icebreaker-backend',
    cwd: './backend',
    script: 'node_modules/ts-node-dev/lib/bin.js',
    args: '--respawn --transpile-only src/index.ts',
    interpreter: 'node',
    env: {
      NODE_ENV: 'development',
      PORT: '3100',
      HTTP_PROXY: 'http://127.0.0.1:33210',
      HTTPS_PROXY: 'http://127.0.0.1:33210',
      NO_PROXY: 'localhost,127.0.0.1'
    }
  }, {
    name: 'icebreaker-frontend',
    cwd: './frontend',
    script: 'node_modules/.bin/vite',
    args: '--port 5200',
    interpreter: 'node'
  }]
};
