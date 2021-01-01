const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    const monetaryPolicy = await ethers.getContractAt('XdefTokenMonetaryPolicy', contracts.xdefTokenMonetaryPolicy)
    const orchestrator = await ethers.getContractAt('XdefTokenOrchestrator', contracts.xdefTokenOrchestrator)
    const geyser = await ethers.getContractAt('Geyser', contracts.geyser)

    const XdefToken = await ethers.getContractFactory('XdefToken')
    const xdefToken = await upgrades.upgradeProxy(contracts.xdefToken, XdefToken)
    await xdefToken.deployed()

    await (await monetaryPolicy.setXdefToken(xdefToken.address)).wait()
    await (await geyser.setXdefToken(xdefToken.address)).wait()

    console.log('XdefToken re-deployed to:', xdefToken.address)
    saveContractAddress(hre.network.name, 'xdefToken', xdefToken.address)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
