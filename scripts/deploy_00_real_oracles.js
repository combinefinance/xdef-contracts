const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress, uniswap2FactoryAddress } = require('./utils')


// https://docs.tellor.io/tellor/integration/reference-page
//const tellorOracleAddress = hre.network.name == 'rinkeby' ? '0xFe41Cb708CD98C5B20423433309E55b53F79134a' : '0x0ba45a8b5d5575935b8158a88c631e9f9c95a2e5';

const tellorOracleAddress = '0x20374E579832859f180536A69093A126Db1c8aE9';
const tellorFeedId = 57;

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    const TvlOracle = await ethers.getContractFactory('TvlOracle');
    const tvlOracle = await TvlOracle.deploy(tellorOracleAddress, tellorFeedId);
    await tvlOracle.deployed();
    console.log('TvlOracle deployed to:', tvlOracle.address)
    saveContractAddress(hre.network.name, 'tvlOracle', tvlOracle.address)

    const TokenPriceOracle = await ethers.getContractFactory('TokenPriceOracle');
    // constructor arguments: address factory_, uint windowSize_, uint8 granularity_
    const tokenPriceOracle = await TokenPriceOracle.deploy(uniswap2FactoryAddress, 3600, 10);
    await tokenPriceOracle.deployed();
    console.log('TokenPriceOracle deployed to:', tokenPriceOracle.address);
    saveContractAddress(hre.network.name, 'tokenPriceOracle', tokenPriceOracle.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
