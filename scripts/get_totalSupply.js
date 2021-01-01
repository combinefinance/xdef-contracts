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

    const addr = contracts.xdefToken;
    const xdefToken = await ethers.getContractAt('XdefToken', addr);
    const totalSupply = await xdefToken.totalSupply();
    console.log(addr, 'totalSupply:',  totalSupply.toString())
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
