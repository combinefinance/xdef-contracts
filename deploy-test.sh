#!/bin/bash

npx hardhat run scripts/hardhat_reset.js
npx hardhat run scripts/deploy_00_simple_oracles.js
npx hardhat run scripts/deploy_00_testnet_lptoken.js
npx hardhat run scripts/deploy_01_deploy_token.js
npx hardhat run scripts/deploy_02_deploy_contracts.js
npx hardhat run scripts/deploy_03_deploy_geyser.js
npx hardhat run scripts/set_price_tvl.js 
npx hardhat run scripts/fill_rewards_pool.js
npx hardhat run scripts/deposit_lptokens_to_geyser.js
npx hardhat run scripts/save_abi.js

cp contract-addresses.json ../xdef-ui/js/
cp abi.json ../xdef-ui/js/
