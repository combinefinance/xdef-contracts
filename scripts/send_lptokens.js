const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const e18 = BigInt(1000000000000000000);
    const hrAmount = BigInt(1000);
    const amount = hrAmount * e18;

    const contracts = getSavedContractAddresses()[hre.network.name]

    const dstAddress = '';
    const lpToken = await ethers.getContractAt('LPToken', contracts.lpToken);
    (await lpToken._mint(dstAddress, amount)).wait();
    console.log(`lpTokens minted to ${dstAddress}`);

    const xdefToken = await ethers.getContractAt('XdefToken', contracts.xdefToken);
    (await xdefToken.transfer(dstAddress, BigInt(10 * 1e9))).wait();
    console.log(`Sent Xdef tokens to ${dstAddress}`)
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
