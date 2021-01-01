const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    const Geyser = await ethers.getContractFactory('Geyser')
    const geyser = await upgrades.upgradeProxy(contracts.geyser, Geyser)
    await geyser.deployed()

    console.log('Geyser re-deployed to:', geyser.address)
    saveContractAddress(hre.network.name, 'geyser', geyser.address)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })