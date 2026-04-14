// .agents/skills/amazebid-core/scripts/sys-check.js
const http = require('http');

const checkEndpoint = (url) => {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
};

async function runCheck() {
  console.log('--- AmazeBid System Health Audit ---');
  
  const apiOk = await checkEndpoint('http://localhost:3000/api/health');
  console.log(`[API Server]  : ${apiOk ? '✅ ONLINE' : '❌ OFFLINE'}`);
  
  const gunOk = await checkEndpoint('http://localhost:3000/gun');
  console.log(`[P2P Relay]   : ${gunOk ? '✅ ACTIVE' : '❌ INACTIVE'}`);
  
  if (apiOk && gunOk) {
    console.log('\nKết luận: Hệ thống AmazeBid đang vận hành ổn định.');
  } else {
    console.log('\nCảnh báo: Phát hiện lỗi trong hạ tầng. Hãy kiểm tra lại server.ts và .env');
  }
}

runCheck();
