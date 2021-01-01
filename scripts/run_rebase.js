const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    const xdefTokenOrchestrator = await ethers.getContractAt('XdefTokenOrchestrator', contracts.xdefTokenOrchestrator);
    (await xdefTokenOrchestrator.rebase()).wait();
    console.log('Successful rebase')
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
