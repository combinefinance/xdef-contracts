const hre = require('hardhat')
const { saveJSON } = require('./utils')

function getABI(name) {
    return hre.artifacts.readArtifactSync(name).abi;
}

async function main() {
    await hre.run('compile')
    const filename = 'abi.json';

    const oracleABI = getABI('MockOracle');

    let ABIs = {
        'tvlOracle': oracleABI,
        'tokenPriceOracle': oracleABI,
        'xdefToken': getABI('XdefToken'),
        'xdefTokenMonetaryPolicy': getABI('XdefTokenMonetaryPolicy'),
        'geyser': getABI('Geyser'),
        'lpToken': getABI('ERC20UpgradeSafe')
    };

    saveJSON(ABIs, filename);

    console.log(`ABI stored to ${filename}`)
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
