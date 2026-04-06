module.exports = {
  apps: [{
    name:         'shopbd-api',
    script:       './src/server.js',
    instances:    'max',
    exec_mode:    'cluster',
    watch:        false,
    env_production: {
      NODE_ENV:   'production',
      PORT:       5000,
    },
    max_memory_restart: '500M',
    error_file:   './logs/err.log',
    out_file:     './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm',
  }],
};