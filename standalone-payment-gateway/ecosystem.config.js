module.exports = {
  apps: [
    {
      name: 'tetherplus-payout-engine',
      script: 'server.js',
      cwd: '/var/www/payment-gateway',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
