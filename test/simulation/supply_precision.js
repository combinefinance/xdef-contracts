/*
    In this hardhat script,
    During every iteration:
    * We double the total Xdef supply.
    * We test the following guarantee:
            - the difference in totalSupply() before and after the rebase(+1) should be exactly 1.

    USAGE:
    hardhat run ./test/simulation/supply_precision.js
*/

const { ethers, web3, upgrades, expect, BigNumber, isEthException, awaitTx, waitForSomeTime, currentTime, toBASEDenomination } = require('../setup')

const endSupply = BigNumber.from(2).pow(128).sub(1)

let xdefToken, preRebaseSupply, postRebaseSupply
preRebaseSupply = BigNumber.from(0)
postRebaseSupply = BigNumber.from(0)

async function exec() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const XdefToken = await ethers.getContractFactory('XdefToken')
    xdefToken = await upgrades.deployProxy(XdefToken, [])
    await xdefToken.deployed()
    xdefToken = xdefToken.connect(deployer)
    await awaitTx(xdefToken.setMonetaryPolicy(await deployer.getAddress()))

    let i = 0
    do {
        console.log('Iteration', i + 1)

        preRebaseSupply = await xdefToken.totalSupply()
        await awaitTx(xdefToken.rebase(2 * i, 1))
        postRebaseSupply = await xdefToken.totalSupply()
        console.log('Rebased by 1 Xdef')
        console.log('Total supply is now', postRebaseSupply.toString(), 'Xdef')

        console.log('Testing precision of supply')
        expect(postRebaseSupply.sub(preRebaseSupply).toNumber()).to.equal(1)

        console.log('Doubling supply')
        await awaitTx(xdefToken.rebase(2 * i + 1, postRebaseSupply))
        i++
    } while ((await xdefToken.totalSupply()).lt(endSupply))
}

exec()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

