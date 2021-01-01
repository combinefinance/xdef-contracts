const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const XdefToken = await ethers.getContractFactory('XdefToken')
    const xdefToken = await upgrades.deployProxy(XdefToken, [])
    await xdefToken.deployed()
    console.log('XdefToken deployed to:', xdefToken.address)
    saveContractAddress(hre.network.name, 'xdefToken', xdefToken.address)
    
    return
    const XdefTokenMonetaryPolicy = await ethers.getContractFactory('XdefTokenMonetaryPolicy')
    const xdefTokenMonetaryPolicy = await upgrades.deployProxy(XdefTokenMonetaryPolicy, [xdefToken.address])
    await xdefTokenMonetaryPolicy.deployed()
    console.log('XdefTokenMonetaryPolicy deployed to:', xdefTokenMonetaryPolicy.address)
    saveContractAddress(hre.network.name, 'xdefTokenMonetaryPolicy', xdefTokenMonetaryPolicy.address)

    const XdefTokenOrchestrator = await ethers.getContractFactory('XdefTokenOrchestrator')
    const xdefTokenOrchestrator = await upgrades.deployProxy(XdefTokenOrchestrator, [xdefTokenMonetaryPolicy.address])
    await xdefTokenOrchestrator.deployed()
    console.log('XdefTokenOrchestrator deployed to:', xdefTokenOrchestrator.address)
    saveContractAddress(hre.network.name, 'xdefTokenOrchestrator', xdefTokenOrchestrator.address)

    await (await xdefToken.setMonetaryPolicy(xdefTokenMonetaryPolicy.address)).wait()
    console.log('XdefToken.setMonetaryPolicy(', xdefTokenMonetaryPolicy.address, ') succeeded')
    await (await xdefTokenMonetaryPolicy.setOrchestrator(xdefTokenOrchestrator.address)).wait()
    console.log('XdefTokenMonetaryPolicy.setOrchestrator(', xdefTokenOrchestrator.address, ') succeeded')

    const contracts = getSavedContractAddresses()[hre.network.name]

    await (await xdefTokenMonetaryPolicy.setTvlOracle(contracts.tvlOracle)).wait()
    console.log('XdefTokenMonetaryPolicy.setTvlOracle(', contracts.tvlOracle, ') succeeded')
    await (await xdefTokenMonetaryPolicy.setTokenPriceOracle(contracts.tokenPriceOracle)).wait()
    console.log('XdefTokenMonetaryPolicy.setTokenPriceOracle(', contracts.tokenPriceOracle, ') succeeded')
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
