require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-ethers')
require("@nomiclabs/hardhat-web3")
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades')

const process = require('process');
const dotenv = require('dotenv');
dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async() => {
    const accounts = await ethers.getSigners()

    for (const account of accounts) {
        console.log(await account.getAddress())
    }
})

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://hardhat.org/config/ to learn more
module.exports = {
    defaultNetwork: 'rinkeby',
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        hardhat: {
            forking: {
                url: process.env.MAINNET_URL
            },
            chainId: 31338
        },
	// Fix INITIAL_SUPPLY FIRST
//        mainnet: {
//            url: process.env.MAINNET_URL,
//            //gasPrice: 76000000000,
//            accounts: { mnemonic: process.env.MAINNET_MNEMONIC }
//        },
        rinkeby: {
            url: process.env.RINKEBY_URL,
            accounts: { mnemonic: process.env.RINKEBY_MNEMONIC }
        }
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_APIKEY,
        url: "https://api-rinkeby.etherscan.io/api"
    },
    solidity: {
        compilers: [{
                version: "0.6.12"
            },
            {
                version: "0.6.6"
            }
        ]
    },
    paths: {
        tests: './test/unit',
    },
}
