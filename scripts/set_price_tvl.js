const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const TVL = 15909587343;
    const contracts = getSavedContractAddresses()[hre.network.name]

    const tvlOracle = await ethers.getContractAt('SimpleOracle', contracts.tvlOracle);
    const tokenPriceOracle = await ethers.getContractAt('SimpleOracle', contracts.tokenPriceOracle);
    const owner = await tvlOracle.owner();
    console.log('owner:', owner);
    const e18 = BigInt(1000000000000000000);
    (await tvlOracle.storeData(BigInt(TVL) * e18)).wait();
    (await tokenPriceOracle.storeData(BigInt(19) * e18 / BigInt(100))).wait();
    console.log('New values are set');
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
