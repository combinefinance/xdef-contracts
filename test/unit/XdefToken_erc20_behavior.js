/*
    MIT License

    Copyright (c) 2016 Smart Contract Solutions, Inc.
    Copyright (c) 2018 Fragments, Inc.
    Copyright (c) 2020 Base Protocol, Inc.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

    This file tests if the XdefToken contract confirms to the ERC20 specification.
    These test cases are inspired from OpenZepplin's ERC20 unit test.
    https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/token/ERC20/ERC20.test.js
*/
const { ethers, web3, upgrades, expect, BigNumber, isEthException, awaitTx, waitForSomeTime, currentTime, toBASEDenomination } = require('../setup')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const INITIAL_SUPPLY = toBASEDenomination(50 * 10 ** 6)
const transferAmount = toBASEDenomination(10)
const unitTokenAmount = toBASEDenomination(1)
const overdraftAmount = INITIAL_SUPPLY.add(unitTokenAmount)
const overdraftAmountPlusOne = overdraftAmount.add(unitTokenAmount)
const overdraftAmountMinusOne = overdraftAmount.sub(unitTokenAmount)
const transferAmountPlusOne = transferAmount.add(unitTokenAmount)
const transferAmountMinusOne = transferAmount.sub(unitTokenAmount)

let xdefToken, owner, ownerAddr, anotherAccount, anotherAccountAddr, recipient, recipientAddr, r
async function setupContractAndAccounts () {
    accounts = await ethers.getSigners()
    owner = accounts[0]
    ownerAddr = await owner.getAddress()
    anotherAccount = accounts[8]
    anotherAccountAddr = await anotherAccount.getAddress()
    recipient = accounts[9]
    recipientAddr = await recipient.getAddress()

    const XdefToken = await ethers.getContractFactory('XdefToken')
    xdefToken = await upgrades.deployProxy(XdefToken, [])
    await xdefToken.deployed()
    xdefToken = xdefToken.connect(owner)
}

describe('XdefToken:ERC20', () => {
    before('setup XdefToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('totalSupply', () => {
        it('returns the total amount of tokens', async () => {
            (await xdefToken.totalSupply()).should.equal(INITIAL_SUPPLY)
        })
    })

    describe('balanceOf', () => {
        describe('when the requested account has no tokens', () => {
            it('returns zero', async () => {
                (await xdefToken.balanceOf(anotherAccountAddr)).should.equal(0)
            })
        })

        describe('when the requested account has some tokens', () => {
            it('returns the total amount of tokens', async () => {
                (await xdefToken.balanceOf(ownerAddr)).should.equal(INITIAL_SUPPLY)
            })
        })
    })
})

describe('XdefToken:ERC20:transfer', () => {
    before('setup XdefToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('when the sender does NOT have enough balance', () => {
        it('reverts', async () => {
            expect(
                await isEthException(xdefToken.transfer(recipientAddr, overdraftAmount))
            ).to.be.true
        })
    })

    describe('when the sender has enough balance', () => {
        before(async () => {
            r = await awaitTx(xdefToken.transfer(recipientAddr, transferAmount))
        })

        it('should transfer the requested amount', async () => {
            const senderBalance = await xdefToken.balanceOf(ownerAddr)
            const recipientBalance = await xdefToken.balanceOf(recipientAddr)
            const supply = await xdefToken.totalSupply()
            supply.sub(transferAmount).should.equal(senderBalance)
            recipientBalance.should.equal(transferAmount)
        })
        it('should emit a transfer event', async () => {
            expect(r.events.length).to.equal(1)
            expect(r.events[0].event).to.equal('Transfer')
            expect(r.events[0].args.from).to.equal(ownerAddr)
            expect(r.events[0].args.to).to.equal(recipientAddr)
            r.events[0].args.value.should.equal(transferAmount)
        })
    })

    describe('when the recipient is the zero address', () => {
        it('should fail', async () => {
            expect(
                await isEthException(xdefToken.transfer(ZERO_ADDRESS, transferAmount))
            ).to.be.true
        })
    })
})

describe('XdefToken:ERC20:transferFrom', () => {
    before('setup XdefToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('when the spender does NOT have enough approved balance', () => {
        describe('when the owner does NOT have enough balance', () => {
            it('reverts', async () => {
                await awaitTx(xdefToken.approve(anotherAccountAddr, overdraftAmountMinusOne))
                expect(
                    await isEthException(xdefToken.connect(anotherAccount).transferFrom(ownerAddr, recipientAddr, overdraftAmount))
                ).to.be.true
            })
        })

        describe('when the owner has enough balance', () => {
            it('reverts', async () => {
                await awaitTx(xdefToken.approve(anotherAccountAddr, transferAmountMinusOne))
                expect(
                    await isEthException(xdefToken.connect(anotherAccount).transferFrom(ownerAddr, recipientAddr, transferAmount))
                ).to.be.true
            })
        })
    })

    describe('when the spender has enough approved balance', () => {
        describe('when the owner does NOT have enough balance', () => {
            it('should fail', async () => {
                await awaitTx(xdefToken.approve(anotherAccountAddr, overdraftAmount))
                expect(
                    await isEthException(xdefToken.connect(anotherAccount).transferFrom(ownerAddr, recipientAddr, overdraftAmount))
                ).to.be.true
            })
        })

        describe('when the owner has enough balance', () => {
            let prevSenderBalance, r
            before(async () => {
                prevSenderBalance = await xdefToken.balanceOf(ownerAddr)
                await xdefToken.approve(anotherAccountAddr, transferAmount)
                r = await (await xdefToken.connect(anotherAccount).transferFrom(ownerAddr, recipientAddr, transferAmount)).wait()
            })

            it('transfers the requested amount', async () => {
                const senderBalance = await xdefToken.balanceOf(ownerAddr)
                const recipientBalance = await xdefToken.balanceOf(recipientAddr)
                prevSenderBalance.sub(transferAmount).should.equal(senderBalance)
                recipientBalance.should.equal(transferAmount)
            })
            it('decreases the spender allowance', async () => {
                expect((await xdefToken.allowance(ownerAddr, anotherAccountAddr)).eq(0)).to.be.true
            })
            it('emits a transfer event', async () => {
                expect(r.events.length).to.equal(1)
                expect(r.events[0].event).to.equal('Transfer')
                expect(r.events[0].args.from).to.equal(ownerAddr)
                expect(r.events[0].args.to).to.equal(recipientAddr)
                r.events[0].args.value.should.equal(transferAmount)
            })
        })
    })
})

describe('XdefToken:ERC20:approve', () => {
    before('setup XdefToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('when the spender is NOT the zero address', () => {
        describe('when the sender has enough balance', () => {
            describe('when there was no approved amount before', () => {
                before(async () => {
                    await awaitTx(xdefToken.approve(anotherAccountAddr, 0))
                    r = await awaitTx(xdefToken.approve(anotherAccountAddr, transferAmount))
                })

                it('approves the requested amount', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(transferAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(transferAmount)
                })
            })

            describe('when the spender had an approved amount', () => {
                before(async () => {
                    await awaitTx(xdefToken.approve(anotherAccountAddr, toBASEDenomination(1)))
                    r = await awaitTx(xdefToken.approve(anotherAccountAddr, transferAmount))
                })

                it('approves the requested amount and replaces the previous one', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(transferAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(transferAmount)
                })
            })
        })

        describe('when the sender does not have enough balance', () => {
            describe('when there was no approved amount before', () => {
                before(async () => {
                    await xdefToken.approve(anotherAccountAddr, 0)
                    r = await (await xdefToken.approve(anotherAccountAddr, overdraftAmount)).wait()
                })

                it('approves the requested amount', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(overdraftAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(overdraftAmount)
                })
            })

            describe('when the spender had an approved amount', () => {
                before(async () => {
                    await xdefToken.approve(anotherAccountAddr, toBASEDenomination(1))
                    r = await (await xdefToken.approve(anotherAccountAddr, overdraftAmount)).wait()
                })

                it('approves the requested amount', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(overdraftAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(overdraftAmount)
                })
            })
        })
    })
})

describe('XdefToken:ERC20:increaseAllowance', () => {
    before('setup XdefToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('when the spender is NOT the zero address', () => {
        describe('when the sender has enough balance', () => {
            describe('when there was no approved amount before', () => {
                before(async () => {
                    await xdefToken.approve(anotherAccountAddr, 0)
                    r = await (await xdefToken.increaseAllowance(anotherAccountAddr, transferAmount)).wait()
                })
                it('approves the requested amount', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(transferAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(transferAmount)
                })
            })

            describe('when the spender had an approved amount', () => {
                beforeEach(async () => {
                    await xdefToken.approve(anotherAccountAddr, unitTokenAmount)
                    r = await (await xdefToken.increaseAllowance(anotherAccountAddr, transferAmount)).wait()
                })

                it('increases the spender allowance adding the requested amount', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(transferAmountPlusOne)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(transferAmountPlusOne)
                })
            })
        })

        describe('when the sender does not have enough balance', () => {
            describe('when there was no approved amount before', () => {
                before(async () => {
                    await xdefToken.approve(anotherAccountAddr, 0)
                    r = await (await xdefToken.increaseAllowance(anotherAccountAddr, overdraftAmount)).wait()
                })

                it('approves the requested amount', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(overdraftAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(overdraftAmount)
                })
            })

            describe('when the spender had an approved amount', () => {
                beforeEach(async () => {
                    await xdefToken.approve(anotherAccountAddr, unitTokenAmount)
                    r = await (await xdefToken.increaseAllowance(anotherAccountAddr, overdraftAmount)).wait()
                })

                it('increases the spender allowance adding the requested amount', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(overdraftAmountPlusOne)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(overdraftAmountPlusOne)
                })
            })
        })
    })
})

describe('XdefToken:ERC20:decreaseAllowance', () => {
    before('setup XdefToken contract', async () => {
        await setupContractAndAccounts()
    })

    describe('when the spender is NOT the zero address', () => {
        describe('when the sender does NOT have enough balance', () => {
            describe('when there was no approved amount before', () => {
                before(async () => {
                    r = await (await xdefToken.decreaseAllowance(anotherAccountAddr, overdraftAmount)).wait()
                })

                it('keeps the allowance to zero', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(0)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(0)
                })
            })

            describe('when the spender had an approved amount', () => {
                before(async () => {
                    await xdefToken.approve(anotherAccountAddr, overdraftAmountPlusOne)
                    r = await (await xdefToken.decreaseAllowance(anotherAccountAddr, overdraftAmount)).wait()
                })

                it('decreases the spender allowance subtracting the requested amount', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(unitTokenAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(unitTokenAmount)
                })
            })
        })

        describe('when the sender has enough balance', () => {
            describe('when there was no approved amount before', () => {
                before(async () => {
                    await xdefToken.approve(anotherAccountAddr, 0)
                    r = await (await xdefToken.decreaseAllowance(anotherAccountAddr, transferAmount)).wait()
                })

                it('keeps the allowance to zero', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(0)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(0)
                })
            })

            describe('when the spender had an approved amount', () => {
                before(async () => {
                    await xdefToken.approve(anotherAccountAddr, transferAmountPlusOne)
                    r = await (await xdefToken.decreaseAllowance(anotherAccountAddr, transferAmount)).wait()
                })

                it('decreases the spender allowance subtracting the requested amount', async () => {
                    (await xdefToken.allowance(ownerAddr, anotherAccountAddr)).should.equal(unitTokenAmount)
                })

                it('emits an approval event', async () => {
                    expect(r.events.length).to.equal(1)
                    expect(r.events[0].event).to.equal('Approval')
                    expect(r.events[0].args.owner).to.equal(ownerAddr)
                    expect(r.events[0].args.spender).to.equal(anotherAccountAddr)
                    r.events[0].args.value.should.equal(unitTokenAmount)
                })
            })
        })
    })
})
