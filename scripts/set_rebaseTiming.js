const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    const xdefTokenMonetaryPolicy = await ethers.getContractAt('XdefTokenMonetaryPolicy', contracts.xdefTokenMonetaryPolicy);

    /*
        function setRebaseTimingParameters(
        uint256 minRebaseTimeIntervalSec_,
        uint256 rebaseWindowOffsetSec_,
        uint256 rebaseWindowLengthSec_)
    */
    (await xdefTokenMonetaryPolicy.setRebaseTimingParameters(60 * 2, 60 * 1, 60 * 1)).wait();
    console.log('New values are set')
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
