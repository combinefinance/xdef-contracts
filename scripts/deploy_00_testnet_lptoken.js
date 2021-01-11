const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')

async function main() {
    await hre.run('compile')

    const contracts = getSavedContractAddresses()[hre.network.name]

    /*    
    const ERC20UpgradeSafe = await ethers.getContractFactory('ERC20UpgradeSafe')
    const lpToken = await upgrades.deployProxy(ERC20UpgradeSafe, [])
    */
    const LPToken = await ethers.getContractFactory('LPToken');
    const lpToken = await LPToken.deploy();
    await lpToken.deployed();

    console.log('LP token deployed to:', lpToken.address)
    saveContractAddress(hre.network.name, 'lpToken', lpToken.address)
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
