const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const XdefToken = await ethers.getContractFactory('XdefToken')
    const xdefToken = await XdefToken.deploy() //await upgrades.deployProxy(XdefToken, [])
    await xdefToken.deployed()
    console.log('XdefToken deployed to:', xdefToken.address)
    saveContractAddress(hre.network.name, 'xdefToken', xdefToken.address)
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })