const fs = require('fs')
const path = require('path')
const hre = require('hardhat')
const { ethers } = hre

function getSavedContractAddresses() {
    let json
    try {
        json = fs.readFileSync(path.join(__dirname, '../contract-addresses.json'))
    } catch (err) {
        json = '{}'
    }
    const addrs = JSON.parse(json)
    return addrs
}

function saveContractAddress(network, contract, address) {
    const addrs = getSavedContractAddresses()
    addrs[network] = addrs[network] || {}
    addrs[network][contract] = address
    fs.writeFileSync(path.join(__dirname, '../contract-addresses.json'), JSON.stringify(addrs, null, '    '))
}

function saveJSON(data, filename) {
    fs.writeFileSync(path.join(__dirname, `../${filename}`), JSON.stringify(data, null, '    '))
}

function objFormatEther(obj) {
    let result = {}
    for (let [k, v] of Object.entries(obj)) {
        result[k] = ethers.utils.formatEther(v)
    }
    return result
}

const uniswap2FactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const uniswap2RouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

module.exports = {
    getSavedContractAddresses,
    saveContractAddress,
    saveJSON,
    objFormatEther,
    uniswap2FactoryAddress,
    uniswap2RouterAddress
}
