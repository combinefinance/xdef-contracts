const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    const xdefTokenMonetaryPolicy = await ethers.getContractAt('XdefTokenMonetaryPolicy', contracts.xdefTokenMonetaryPolicy);
    const inRebaseWindow = await xdefTokenMonetaryPolicy.inRebaseWindow();
    if (inRebaseWindow) {
        const xdefTokenOrchestrator = await ethers.getContractAt('XdefTokenOrchestrator', contracts.xdefTokenOrchestrator);
        (await xdefTokenOrchestrator.rebase()).wait();
        console.log('Rebased')
    } else {
        console.log("Not in rebase window yet")
    }
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })