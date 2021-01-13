const hre = require('hardhat')
const { ethers, upgrades } = hre
const { getSavedContractAddresses, saveContractAddress } = require('./utils')
const axios = require('axios');

async function main() {
    await hre.run('compile')

    const TVL = await fetchTVL();
    //console.log(TVL)
    //return 

    //const TVL = 25249652574.364998;
    const tokenPrice = 0.11;

    console.log(`Pushing new values: TVL: ${TVL}, tokenPrice: ${tokenPrice}`);

    const contracts = getSavedContractAddresses()[hre.network.name]

    const tvlOracle = await ethers.getContractAt('SimpleOracle', contracts.tvlOracle);
    const tokenPriceOracle = await ethers.getContractAt('SimpleOracle', contracts.tokenPriceOracle);
    const owner = await tvlOracle.owner();
    console.log('owner:', owner);
    await (await tvlOracle.storeData(BigInt(TVL*1e18))).wait();
    await (await tokenPriceOracle.storeData(BigInt(tokenPrice*1e18))).wait();
    console.log(`New values are set. TVL: ${TVL}, tokenPrice: ${tokenPrice}`);
}

async function fetchTVL() {
    const defillama = (await axios.get('https://api.defillama.com/charts')).data;
    const defillamaTVL = parseFloat(defillama[defillama.length - 1].totalLiquidityUSD);

    const defipulse = (await axios.get('https://data-api.defipulse.com/api/v1/defipulse/api/MarketData'/*, { params: { "api-key": DEFIPULSE_APIKEY } } */)).data;
    const defipulseTVL = defipulse.All.total;

    const medianizedValue = (defillamaTVL + defipulseTVL) / 2
    return medianizedValue
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
