const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    const LPToken = await ethers.getContractFactory('lpToken')
    const lpToken = await upgrades.upgradeProxy(contracts.lpToken, LPToken)
    await lpToken.deployed()

    const geyser = await ethers.getContractAt('Geyser', contracts.geyser)
    await (await geyser.setLPToken(lpToken.address)).wait()

    console.log('lpToken re-deployed to:', lpToken.address)
    saveContractAddress(hre.network.name, 'lpToken', lpToken.address)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })