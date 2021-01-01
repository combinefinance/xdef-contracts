const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress, objFormatEther } = require('./utils')

async function main() {
    await hre.run('compile')

    //ethers.provider.send("evm_increaseTime", [60 * 60 * 24 * 3]);
    //ethers.provider.send("evm_mine");

    const [signer] = await ethers.getSigners()
    const signerAddr = await signer.getAddress()

    const contracts = getSavedContractAddresses()[hre.network.name]

    const geyser = await ethers.getContractAt('Geyser', contracts.geyser);
    const depositInfo = await geyser.depositInfo(signerAddr);
    console.log(`depositInfo:`, objFormatEther(depositInfo));
    const totalSeconds = await geyser.totalDepositSeconds();
    console.log(`totalDepositSeconds:`, totalSeconds.toString());
    const rewardsPool = await geyser.rewardsPool();
    console.log('rewardsPool:', ethers.utils.formatEther(rewardsPool));
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
