# Xdef token smartcontracts

## Usage

Install deps
```
yarn install --ignore-engines
```

Set variables in `.env` file:
```
MAINNET_URL='https://mainnet.infura.io/v3/undefined
RINKEBY_URL='https://rinkeby.infura.io/v3/undefined
ETHERSCAN_APIKEY='someApiKey'
MAINNET_MNEMONIC='some mnemonic here'
RINKEBY_MNEMONIC='and here'
``` 

Set desired network in `hardhat.config.js` as default and run:
```
./deploy.sh
```

Contracts will be deployed, also
`contract-addresses.json` and `api.json` files will be created, copy it to `xdef-ui/js`

Check hardhat docs
[https://hardhat.org/](https://hardhat.org/)