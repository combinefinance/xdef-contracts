const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const signers = (await ethers.getSigners()) //.slice(3, 4);
    const e18 = BigInt(1000000000000000000);
    const hrAmount = BigInt(1000);
    const amount = hrAmount * e18;

    const contracts = getSavedContractAddresses()[hre.network.name]


    const geyser = await ethers.getContractAt('Geyser', contracts.geyser);
    (await geyser.setMinTimeBetweenWithdrawals(3600)).wait();

}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })