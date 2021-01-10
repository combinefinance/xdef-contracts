const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    const Geyser = await ethers.getContractFactory('Geyser')
    const geyser = await upgrades.deployProxy(Geyser, [])
    await geyser.deployed()
    console.log('Geyser deployed to:', geyser.address)
    saveContractAddress(hre.network.name, 'geyser', geyser.address)
    await (await geyser.setLPToken(contracts.lpToken)).wait()
    console.log('Geyser.setLPToken(', contracts.lpToken, ') succeeded')
    await (await geyser.setXdefToken(contracts.xdefToken)).wait()
    console.log('Geyser.setXdefToken(', contracts.xdefToken, ') succeeded')
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
