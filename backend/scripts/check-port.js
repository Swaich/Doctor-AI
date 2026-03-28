const net = require('net');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

async function main() {
  const targetPort = process.env.PORT || 5000;
  
  console.log(`🔍 Checking port ${targetPort}...`);
  
  const isAvailable = await checkPort(targetPort);
  
  if (isAvailable) {
    console.log(`✅ Port ${targetPort} is available`);
    process.exit(0);
  } else {
    console.log(`❌ Port ${targetPort} is already in use`);
    console.log(`\n💡 Solutions:`);
    console.log(`   1. Kill the process using port ${targetPort}:`);
    console.log(`      - Windows: netstat -ano | findstr :${targetPort}`);
    console.log(`      - Mac/Linux: lsof -ti:${targetPort} | xargs kill -9`);
    console.log(`   2. Use a different port:`);
    console.log(`      - Set PORT=${parseInt(targetPort) + 1} in your .env file`);
    console.log(`   3. Check if another instance is running`);
    
    // Check common alternative ports
    console.log(`\n🔍 Checking alternative ports...`);
    for (let port = parseInt(targetPort) + 1; port <= parseInt(targetPort) + 5; port++) {
      const available = await checkPort(port);
      if (available) {
        console.log(`✅ Port ${port} is available as alternative`);
        break;
      } else {
        console.log(`❌ Port ${port} is also in use`);
      }
    }
    
    process.exit(1);
  }
}

main().catch(console.error);