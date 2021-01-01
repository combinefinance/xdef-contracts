const hre = require('hardhat')
const { ethers, upgrades } = hre

async function main() {
	await hre.network.provider.request({
	  method: "hardhat_reset",
	  params: []
	});
        console.log('Hardhat network resetted');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
