const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    const tvlOracle = await ethers.getContractAt('SimpleOracle', contracts.tvlOracle);

    const tokenPriceOracle = await ethers.getContractAt('SimpleOracle', contracts.tokenPriceOracle);
    
    const tvl = (await tvlOracle.getData())[0].toString();
    const price = (await tokenPriceOracle.getData())[0].toString();
    console.log('tvl:', tvl, 'price:', price)

    
    const xdefTokenMonetaryPolicy = await ethers.getContractAt('XdefTokenMonetaryPolicy', contracts.xdefTokenMonetaryPolicy);
    const val = await xdefTokenMonetaryPolicy.getNextSupplyDelta();
    console.log('nextSupplyDelta:', val.map(v=>v.toString()));
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
