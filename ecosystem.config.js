'use strict';
module.exports = {
  apps: [
    {
      name: 'jigugong-image-server', // pm2로 실행한 프로세스 목록에서 이 애플리케이션의 이름으로 지정될 문자열
      script: 'npm', // pm2로 실행될 파일 경로
      args : "start",
      watch: false, // 파일이 변경되면 자동으로 재실행 (true || false)
      ignore_watch: ['[/\\]./', 'node_modules', 'logs', 'resource'],
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        instances: 1
      }
    },
  ],
};
