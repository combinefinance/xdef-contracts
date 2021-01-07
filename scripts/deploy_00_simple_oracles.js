const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const SimpleOracle = await ethers.getContractFactory('SimpleOracle')
    const tvlOracle = await SimpleOracle.deploy()
    await tvlOracle.deployed()
    console.log('TVL oracle deployed to:', tvlOracle.address)
    saveContractAddress(hre.network.name, 'tvlOracle', tvlOracle.address)

    const tokenPriceOracle = await SimpleOracle.deploy()
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