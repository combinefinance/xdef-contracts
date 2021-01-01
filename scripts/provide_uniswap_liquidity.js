// We require the Buidler Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const UniswapV2RouterArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02');
const { getSavedContractAddresses, saveContractAddress, objFormatEther } = require('./utils');

async function main() {
    // Buidler always runs the compile task when running scripts through it. 
    // If this runs in a standalone fashion you may want to call compile manually 
    // to make sure everything is compiled
    // await hre.run('compile');

    const tokenPriceUSD = 0.11;
    const ethPrice = 628;
    const tokenPriceETH = tokenPriceUSD * ethPrice;
    const tokensToProvide = 10;
    const ethAmount = tokensToProvide / tokenPriceETH;
    console.log('ethAmount:', ethAmount);
    const uniswap2RouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

    const [signer] = await ethers.getSigners()
    const signerAddr = await signer.getAddress()

    const contracts = getSavedContractAddresses()[hre.network.name]

    const xdefToken = await ethers.getContractAt('XdefToken', contracts.xdefToken);
    const xdefTokenDecimals = await xdefToken.decimals();

    (await xdefToken.approve(uniswap2RouterAddress, '115792089237316195423570985008687907853269984665640564039457')).wait();

    const uniswap2Router = (await ethers.getContractAt(UniswapV2RouterArtifact.abi, uniswap2RouterAddress));

    const overrides = {
        value: ethers.utils.parseEther(ethAmount.toString(10))
    };

    console.log(overrides)
        // https://uniswap.org/docs/v2/smart-contracts/router02/#addliquidityeth

    const tx = (await uniswap2Router.addLiquidityETH(
        contracts.xdefToken,
        BigInt(tokensToProvide) * BigInt(xdefTokenDecimals),
        0,
        0,
        signerAddr,
        2008545668,
        overrides)).wait();

    console.log(await tx)
    console.log('added liquidity to Uniswap')
}

async function ethBalance(address) {
    let balance = await ethers.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });