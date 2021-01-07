const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const signers = (await ethers.getSigners()) //.slice(3, 4);
    const e18 = BigInt(1000000000000000000);
    const hrAmount = BigInt(1000);
    const amount = hrAmount * e18;

    const contracts = getSavedContractAddresses()[hre.network.name]

    for (const signer of signers) {
        try {
            const signerAddr = await signer.getAddress()

            const lpToken = await ethers.getContractAt('ERC20UpgradeSafe', contracts.lpToken);
            (await lpToken.connect(signer)._mint(signerAddr, amount)).wait();
            console.log(`lpTokens minted for ${signerAddr}`);
            (await lpToken.connect(signer).approve(contracts.geyser, amount)).wait();
            console.log(`lpTokens approved`);
            const geyser = await ethers.getContractAt('Geyser', contracts.geyser);
            (await geyser.connect(signer).deposit(amount)).wait();
            console.log(`${hrAmount} lpTokens deposited to geyser by ${signerAddr}`)
                //const totalSeconds = await geyser.totalDepositSeconds();
                //console.log(`totalDepositSeconds:`, totalSeconds);
                //const depositInfo = await geyser.depositInfo(signerAddr);
                //console.log(`depositInfo:`, depositInfo);
        } catch (e) {
            console.error(e)
        }
    }
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
