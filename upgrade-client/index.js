const fs = require('fs');
const path = require('path');
const ContractService = require('./contract-service');

// node index.js <contractUrl> <zipFilePath> <version> <description>
const contractUrl = process.argv[2];
const filepath = process.argv[3];
const version = process.argv[4];
const description = process.argv[5] ?? '';

(async function() {
  if (!contractUrl || !filepath || !version) {
    console.log('Usage: node index.js <contractUrl> <zipFilePath> <version> <description>');
    process.exit(1);
  }

  const contractService = new ContractService([contractUrl]);
  const ok = await contractService.init();
  if (!ok) { console.log('Client init failed.'); process.exit(1); }

  const fileName = path.basename(filepath);
  const fileContent = fs.readFileSync(filepath);
  const sizeKB = Math.round(fileContent.length / 1024);

  const request = {
    Service: 'Upgrade',
    Action: 'UpgradeContract',
    data: {
      version: parseInt(version),
      description: description,
      content: fileContent
    }
  };

  console.log(`Uploading the file ${fileName} ${sizeKB}KB (version=${version})`);
  contractService.submitInputToContract(request)
    .then((re) => { console.log('Contract update submission successful.', re); })
    .catch((reason) => { console.log('Contract update submission failed.', reason); })
    .finally(() => { process.exit(); });
})();
