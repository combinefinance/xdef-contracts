const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const MockOracle = await ethers.getContractFactory('MockOracle')
    const tvlOracle = await MockOracle.deploy('tvlOracle')
    await tvlOracle.deployed()
    console.log('Market cap oracle deployed to:', tvlOracle.address)
    saveContractAddress(hre.network.name, 'tvlOracle', tvlOracle.address)

    const tokenPriceOracle = await MockOracle.deploy('Token price oracle')
    await tokenPriceOracle.deployed()
    console.log('Token price oracle deployed to:', tokenPriceOracle.address)
    saveContractAddress(hre.network.name, 'tokenPriceOracle', tokenPriceOracle.address)
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
