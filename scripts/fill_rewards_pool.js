const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]
    const dstAddress = contracts.geyser
    const xdefToken = await ethers.getContractAt('XdefToken', contracts.xdefToken);
    (await xdefToken.transfer(dstAddress, BigInt(1067064 * 1e9))).wait();
    console.log('Sent Xdef tokens to geyser')
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
