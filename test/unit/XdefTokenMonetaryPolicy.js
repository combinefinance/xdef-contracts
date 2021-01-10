const { ethers, web3, upgrades, expect, BigNumber, isEthException, awaitTx, waitForSomeTime, currentTime, toBASEDenomination } = require('../setup')

let xdefTokenMonetaryPolicy, mockXdefToken, mockTokenPriceOracle, mockTvlOracle, p, MockOracle
let r, prevEpoch, prevTime
let accounts, deployer, deployerAddr, user, userAddr, orchestrator

const tenTo18th = BigNumber.from(10).pow(18)
const MAX_RATE = (BigNumber.from('1')).mul(10 ** 6).mul(tenTo18th)
const MAX_SUPPLY = (BigNumber.from(2).pow(255).sub(1)).div(MAX_RATE)
const Xdef_TVL = BigNumber.from(100).mul(tenTo18th)
const INITIAL_TVL = BigNumber.from(251712).mul(BigNumber.from(10).pow(15))
const INITIAL_TVL_25P_MORE = INITIAL_TVL.mul(125).div(100)
const INITIAL_TVL_25P_LESS = INITIAL_TVL.mul(77).div(100)
const INITIAL_RATE = INITIAL_TVL.mul(tenTo18th).div(Xdef_TVL)
const INITIAL_RATE_30P_MORE = INITIAL_RATE.mul(13).div(10)
const INITIAL_RATE_30P_LESS = INITIAL_RATE.mul(7).div(10)
const INITIAL_RATE_5P_MORE = INITIAL_RATE.mul(105).div(100)
const INITIAL_RATE_5P_LESS = INITIAL_RATE.mul(95).div(100)
const INITIAL_RATE_60P_MORE = INITIAL_RATE.mul(16).div(10)
const INITIAL_RATE_2X = INITIAL_RATE.mul(2)

async function setupContracts() {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    deployerAddr = await deployer.getAddress()
    user = accounts[1]
    userAddr = await user.getAddress()
    orchestrator = accounts[3]
    orchestratorAddr = await orchestrator.getAddress()
    p = orchestrator.provider

    await waitForSomeTime(p, 86400)

    const MockXdefToken = await ethers.getContractFactory('MockXdefToken')
    mockXdefToken = await upgrades.deployProxy(MockXdefToken, [])
    await mockXdefToken.deployed()
    mockXdefToken = mockXdefToken.connect(deployer)

    MockOracle = await ethers.getContractFactory('MockOracle')

    mockTokenPriceOracle = await MockOracle.deploy('TokenPriceOracle')
    await mockTokenPriceOracle.deployed()
    mockTokenPriceOracle = mockTokenPriceOracle.connect(deployer)

    mockTvlOracle = await MockOracle.deploy('TvlOracle')
    await mockTvlOracle.deployed()
    mockTvlOracle = mockTvlOracle.connect(deployer)

    const XdefTokenMonetaryPolicy = await ethers.getContractFactory('XdefTokenMonetaryPolicy')
    xdefTokenMonetaryPolicy = await upgrades.deployProxy(XdefTokenMonetaryPolicy, [mockXdefToken.address])
    await xdefTokenMonetaryPolicy.deployed()
    xdefTokenMonetaryPolicy = xdefTokenMonetaryPolicy.connect(deployer)

    await awaitTx(xdefTokenMonetaryPolicy.setTokenPriceOracle(mockTokenPriceOracle.address))
    await awaitTx(xdefTokenMonetaryPolicy.setTvlOracle(mockTvlOracle.address))
    await awaitTx(xdefTokenMonetaryPolicy.setOrchestrator(orchestratorAddr))
}

async function setupContractsWithOpenRebaseWindow() {
    try {
        await setupContracts()
        await awaitTx(xdefTokenMonetaryPolicy.setRebaseTimingParameters(60, 0, 60))
    } catch (e) {
        console.error(e)
    }
}

async function mockExternalData(rate, tvl, baseSupply, rateValidity = true, tvlValidity = true) {
    await awaitTx(mockTokenPriceOracle.storeData(rate))
    await awaitTx(mockTokenPriceOracle.storeValidity(rateValidity))
    await awaitTx(mockTvlOracle.storeData(tvl))
    await awaitTx(mockTvlOracle.storeValidity(tvlValidity))
    await awaitTx(mockXdefToken.storeSupply(baseSupply))
}

describe('XdefTokenMonetaryPolicy', () => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should reject any ether sent to it', async() => {
        expect(
            await isEthException(user.sendTransaction({ to: xdefTokenMonetaryPolicy.address, value: 1 }))
        ).to.be.true
    })
})

describe('XdefTokenMonetaryPolicy:initialize', async() => {
    describe('initial values set correctly', () => {
        before('setup XdefTokenMonetaryPolicy contract', setupContracts)

        it('deviationThreshold', async() => {
            (await xdefTokenMonetaryPolicy.deviationThreshold()).should.equal(BigNumber.from(5).mul(tenTo18th).div(100))
        })
        it('rebaseLag', async() => {
            (await xdefTokenMonetaryPolicy.rebaseLag()).should.equal(30)
        })
        it('minRebaseTimeIntervalSec', async() => {
            (await xdefTokenMonetaryPolicy.minRebaseTimeIntervalSec()).should.equal(24 * 60 * 60)
        })
        it('epoch', async() => {
            (await xdefTokenMonetaryPolicy.epoch()).should.equal(0)
        })
        it('rebaseWindowOffsetSec', async() => {
            (await xdefTokenMonetaryPolicy.rebaseWindowOffsetSec()).should.equal(72000)
        })
        it('rebaseWindowLengthSec', async() => {
            (await xdefTokenMonetaryPolicy.rebaseWindowLengthSec()).should.equal(900)
        })
        it('should set owner', async() => {
            expect(await xdefTokenMonetaryPolicy.owner()).to.equal(deployerAddr)
        })
        it('should set reference to Xdef', async() => {
            expect(await xdefTokenMonetaryPolicy.Xdef()).to.equal(mockXdefToken.address)
        })
    })
})

describe('XdefTokenMonetaryPolicy:setTokenPriceOracle', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should set tokenPriceOracle', async() => {
        await awaitTx(xdefTokenMonetaryPolicy.setTokenPriceOracle(deployerAddr))
        expect(await xdefTokenMonetaryPolicy.tokenPriceOracle()).to.equal(deployerAddr)
    })
})

describe('XdefToken:setTokenPriceOracle:accessControl', () => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should be callable by owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.setTokenPriceOracle(deployerAddr))
        ).to.be.false
    })

    it('should NOT be callable by non-owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.connect(user).setTokenPriceOracle(deployerAddr))
        ).to.be.true
    })
})

describe('XdefTokenMonetaryPolicy:setTvlOracle', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should set tvlOracle', async() => {
        await xdefTokenMonetaryPolicy.setTvlOracle(deployerAddr)
        expect(await xdefTokenMonetaryPolicy.tvlOracle()).to.equal(deployerAddr)
    })
})

describe('XdefToken:setTvlOracle:accessControl', () => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should be callable by owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.setTvlOracle(deployerAddr))
        ).to.be.false
    })

    it('should NOT be callable by non-owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.connect(user).setTvlOracle(deployerAddr))
        ).to.be.true
    })
})

describe('XdefTokenMonetaryPolicy:setOrchestrator', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should set orchestrator', async() => {
        await awaitTx(xdefTokenMonetaryPolicy.setOrchestrator(userAddr))
        expect(await xdefTokenMonetaryPolicy.orchestrator()).to.equal(userAddr)
    })
})

describe('XdefToken:setOrchestrator:accessControl', () => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should be callable by owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.setOrchestrator(deployerAddr))
        ).to.be.false
    })

    it('should NOT be callable by non-owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.connect(user).setOrchestrator(deployerAddr))
        ).to.be.true
    })
})

describe('XdefTokenMonetaryPolicy:setDeviationThreshold', async() => {
    let prevThreshold, threshold
    before('setup XdefTokenMonetaryPolicy contract', async() => {
        await setupContracts()
        prevThreshold = await xdefTokenMonetaryPolicy.deviationThreshold()
        threshold = prevThreshold.add(BigNumber.from(1).mul(tenTo18th).div(100))
        await awaitTx(xdefTokenMonetaryPolicy.setDeviationThreshold(threshold))
    })

    it('should set deviationThreshold', async() => {
        (await xdefTokenMonetaryPolicy.deviationThreshold()).should.equal(threshold)
    })
})

describe('XdefToken:setDeviationThreshold:accessControl', () => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should be callable by owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.setDeviationThreshold(0))
        ).to.be.false
    })

    it('should NOT be callable by non-owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.connect(user).setDeviationThreshold(0))
        ).to.be.true
    })
})

describe('XdefTokenMonetaryPolicy:setRebaseLag', async() => {
    let prevLag
    before('setup XdefTokenMonetaryPolicy contract', async() => {
        await setupContracts()
        prevLag = await xdefTokenMonetaryPolicy.rebaseLag()
    })

    describe('when rebaseLag is more than 0', async() => {
        it('should setRebaseLag', async() => {
            const lag = prevLag.add(1)
            await awaitTx(xdefTokenMonetaryPolicy.setRebaseLag(lag));
            (await xdefTokenMonetaryPolicy.rebaseLag()).should.equal(lag)
        })
    })

    describe('when rebaseLag is 0', async() => {
        it('should fail', async() => {
            expect(
                await isEthException(xdefTokenMonetaryPolicy.setRebaseLag(0))
            ).to.be.true
        })
    })
})

describe('XdefToken:setRebaseLag:accessControl', () => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should be callable by owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.setRebaseLag(1))
        ).to.be.false
    })

    it('should NOT be callable by non-owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.connect(user).setRebaseLag(1))
        ).to.be.true
    })
})

describe('XdefTokenMonetaryPolicy:setRebaseTimingParameters', async() => {
    before('setup XdefTokenMonetaryPolicy contract', async() => {
        await setupContracts()
    })

    describe('when interval=0', () => {
        it('should fail', async() => {
            expect(
                await isEthException(xdefTokenMonetaryPolicy.setRebaseTimingParameters(0, 0, 0))
            ).to.be.true
        })
    })

    describe('when offset > interval', () => {
        it('should fail', async() => {
            expect(
                await isEthException(xdefTokenMonetaryPolicy.setRebaseTimingParameters(300, 3600, 300))
            ).to.be.true
        })
    })

    describe('when params are valid', () => {
        it('should setRebaseTimingParameters', async() => {
            await awaitTx(xdefTokenMonetaryPolicy.setRebaseTimingParameters(600, 60, 300));
            (await xdefTokenMonetaryPolicy.minRebaseTimeIntervalSec()).should.equal(600);
            (await xdefTokenMonetaryPolicy.rebaseWindowOffsetSec()).should.equal(60);
            (await xdefTokenMonetaryPolicy.rebaseWindowLengthSec()).should.equal(300)
        })
    })
})

describe('XdefToken:setRebaseTimingParameters:accessControl', () => {
    before('setup XdefTokenMonetaryPolicy contract', setupContracts)

    it('should be callable by owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.setRebaseTimingParameters(600, 60, 300))
        ).to.be.false
    })

    it('should NOT be callable by non-owner', async() => {
        expect(
            await isEthException(xdefTokenMonetaryPolicy.connect(user).setRebaseTimingParameters(600, 60, 300))
        ).to.be.true
    })
})

describe('XdefTokenMonetaryPolicy:Rebase:accessControl', async() => {
    beforeEach('setup XdefTokenMonetaryPolicy contract', async() => {
        await setupContractsWithOpenRebaseWindow()
        await mockExternalData(INITIAL_RATE_30P_MORE, INITIAL_TVL, 1000, true)
        await waitForSomeTime(p, 60)
    })

    describe('when rebase called by orchestrator', () => {
        it('should succeed', async() => {
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.false
        })
    })

    describe('when rebase called by non-orchestrator', () => {
        it('should fail', async() => {
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(user).rebase())
            ).to.be.true
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('when minRebaseTimeIntervalSec has NOT passed since the previous rebase', () => {
        before(async() => {
            await mockExternalData(INITIAL_RATE_30P_MORE, INITIAL_TVL, 1010)
            await waitForSomeTime(p, 60)
            await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
        })

        it('should fail', async() => {
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.true
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('when rate is within deviationThreshold', () => {
        before(async() => {
            await awaitTx(xdefTokenMonetaryPolicy.setRebaseTimingParameters(60, 0, 60))
        })

        it('should return 0', async() => {
            await mockExternalData(INITIAL_RATE.sub(1), INITIAL_TVL, 1000)
            await waitForSomeTime(p, 60)
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            r.events[6].args.requestedSupplyAdjustment.should.equal(0)
            await waitForSomeTime(p, 60)

            await mockExternalData(INITIAL_RATE.add(1), INITIAL_TVL, 1000)
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            r.events[6].args.requestedSupplyAdjustment.should.equal(0)
            await waitForSomeTime(p, 60)

            await mockExternalData(INITIAL_RATE_5P_MORE.sub(2), INITIAL_TVL, 1000)
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            r.events[6].args.requestedSupplyAdjustment.should.equal(0)
            await waitForSomeTime(p, 60)

            await mockExternalData(INITIAL_RATE_5P_LESS.add(2), INITIAL_TVL, 1000)
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            r.events[6].args.requestedSupplyAdjustment.should.equal(0)
            await waitForSomeTime(p, 60)
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('when rate is more than MAX_RATE', () => {
        it('should return same supply delta as delta for MAX_RATE', async() => {
            // Any exchangeRate >= (MAX_RATE=100x) would result in the same supply increase
            await mockExternalData(MAX_RATE, INITIAL_TVL, 1000)
            await waitForSomeTime(p, 60)
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            const supplyChange = r.events[6].args.requestedSupplyAdjustment

            await waitForSomeTime(p, 60)

            await mockExternalData(MAX_RATE.add(tenTo18th.div(10)), INITIAL_TVL, 1000)
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            r.events[6].args.requestedSupplyAdjustment.should.equal(supplyChange)

            await waitForSomeTime(p, 60)

            await mockExternalData(MAX_RATE.mul(2), INITIAL_TVL, 1000)
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            r.events[6].args.requestedSupplyAdjustment.should.equal(supplyChange)
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('when xdefToken grows beyond MAX_SUPPLY', () => {
        before(async() => {
            await mockExternalData(INITIAL_RATE_2X, INITIAL_TVL, MAX_SUPPLY.sub(1))
            await waitForSomeTime(p, 60)
        })

        it('should apply SupplyAdjustment {MAX_SUPPLY - totalSupply}', async() => {
            // Supply is MAX_SUPPLY-1, exchangeRate is 2x resulting in a new supply more than MAX_SUPPLY
            // However, supply is ONLY increased by 1 to MAX_SUPPLY
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            r.events[6].args.requestedSupplyAdjustment.should.equal(1)
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('when xdefToken supply equals MAX_SUPPLY and rebase attempts to grow', () => {
        before(async() => {
            await mockExternalData(INITIAL_RATE_2X, INITIAL_TVL, MAX_SUPPLY)
            await waitForSomeTime(p, 60)
        })

        it('should not grow', async() => {
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            r.events[6].args.requestedSupplyAdjustment.should.equal(0)
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('when the market oracle returns invalid data', () => {
        it('should fail', async() => {
            await mockExternalData(INITIAL_RATE_30P_MORE, INITIAL_TVL, 1000, false)
            await waitForSomeTime(p, 60)
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.true
        })
    })

    describe('when the market oracle returns valid data', () => {
        it('should NOT fail', async() => {
            await mockExternalData(INITIAL_RATE_30P_MORE, INITIAL_TVL, 1000, true)
            await waitForSomeTime(p, 60)
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.false
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('when the tvl oracle returns invalid data', () => {
        it('should fail', async() => {
            await mockExternalData(INITIAL_RATE_30P_MORE, INITIAL_TVL, 1000, true, false)
            await waitForSomeTime(p, 60)
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.true
        })
    })

    describe('when the tvl oracle returns valid data', () => {
        it('should NOT fail', async() => {
            await mockExternalData(INITIAL_RATE_30P_MORE, INITIAL_TVL, 1000, true, true)
            await waitForSomeTime(p, 60)
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.false
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('positive rate and no change TVL', () => {
        before(async() => {
            try {
                await mockExternalData(INITIAL_RATE_30P_MORE, INITIAL_TVL, 1000)
                await xdefTokenMonetaryPolicy.setRebaseTimingParameters(60, 0, 60)
                await waitForSomeTime(p, 60)
                await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
                await waitForSomeTime(p, 59)
                prevEpoch = await xdefTokenMonetaryPolicy.epoch()
                prevTime = await xdefTokenMonetaryPolicy.lastRebaseTimestampSec()
                await mockExternalData(INITIAL_RATE_60P_MORE, INITIAL_TVL, 1010)
                r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            } catch (e) { console.error(e) }
        })

        it('should increment epoch', async() => {
            const epoch = await xdefTokenMonetaryPolicy.epoch()
            expect(prevEpoch.add(1).eq(epoch))
        })

        it('should update lastRebaseTimestamp', async() => {
            const time = await xdefTokenMonetaryPolicy.lastRebaseTimestampSec()
            expect(time.sub(prevTime).eq(60)).to.be.true
        })

        it('should emit Rebase with positive requestedSupplyAdjustment', async() => {
            const log = r.events[6]
            expect(log.event).to.equal('LogRebase')
            expect(log.args.epoch.eq(prevEpoch.add(1))).to.be.true
            log.args.exchangeRate.should.equal(INITIAL_RATE_60P_MORE)
            log.args.tvl.should.equal(INITIAL_TVL)
            log.args.requestedSupplyAdjustment.should.equal(20)
        })

        it('should call getData from the market oracle', async() => {
            const fnCalled = MockOracle.interface.decodeEventLog('FunctionCalled', r.events[2].data)
            expect(fnCalled[0]).to.equal('TokenPriceOracle')
            expect(fnCalled[1]).to.equal('getData')
            expect(fnCalled[2]).to.equal(xdefTokenMonetaryPolicy.address)
        })

        it('should call getData from the tvl oracle', async() => {
            const fnCalled = MockOracle.interface.decodeEventLog('FunctionCalled', r.events[0].data)
            expect(fnCalled[0]).to.equal('TvlOracle')
            expect(fnCalled[1]).to.equal('getData')
            expect(fnCalled[2]).to.equal(xdefTokenMonetaryPolicy.address)
        })

        it('should call XdefToken Rebase', async() => {
            prevEpoch = await xdefTokenMonetaryPolicy.epoch()
            const fnCalled = MockOracle.interface.decodeEventLog('FunctionCalled', r.events[4].data)
            expect(fnCalled[0]).to.equal('XdefToken')
            expect(fnCalled[1]).to.equal('rebase')
            expect(fnCalled[2]).to.equal(xdefTokenMonetaryPolicy.address)
            const fnArgs = MockOracle.interface.decodeEventLog('FunctionArguments', r.events[5].data)
            const parsedFnArgs = fnArgs.reduce((m, k) => {
                return k.map(d => d.toNumber()).concat(m)
            }, [])
            expect(parsedFnArgs).to.include.members([prevEpoch.toNumber(), 20])
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('negative rate', () => {
        before(async() => {
            await mockExternalData(INITIAL_RATE_30P_LESS, INITIAL_TVL, 1000)
            await waitForSomeTime(p, 60)
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
        })

        it('should emit Rebase with negative requestedSupplyAdjustment', async() => {
            const log = r.events[6]
            expect(log.event).to.equal('LogRebase')
            log.args.requestedSupplyAdjustment.should.equal(-10)
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('when tvl increases', () => {
        before(async() => {
            await mockExternalData(INITIAL_RATE, INITIAL_TVL_25P_MORE, 1000)
            await waitForSomeTime(p, 60)
            await awaitTx(xdefTokenMonetaryPolicy.setDeviationThreshold(0))
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
        })

        it('should emit Rebase with negative requestedSupplyAdjustment', async() => {
            const log = r.events[6]
            expect(log.event).to.equal('LogRebase')
            log.args.requestedSupplyAdjustment.should.equal(-6)
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('when tvl decreases', () => {
        before(async() => {
            await mockExternalData(INITIAL_RATE, INITIAL_TVL_25P_LESS, 1000)
            await waitForSomeTime(p, 60)
            await awaitTx(xdefTokenMonetaryPolicy.setDeviationThreshold(0))
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
        })

        it('should emit Rebase with positive requestedSupplyAdjustment', async() => {
            const log = r.events[6]
            expect(log.event).to.equal('LogRebase')
            log.args.requestedSupplyAdjustment.should.equal(9)
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    before('setup XdefTokenMonetaryPolicy contract', setupContractsWithOpenRebaseWindow)

    describe('rate=TARGET_RATE', () => {
        before(async() => {
            await mockExternalData(INITIAL_RATE, INITIAL_TVL, 1000)
            await awaitTx(xdefTokenMonetaryPolicy.setDeviationThreshold(0))
            await waitForSomeTime(p, 60)
            r = await awaitTx(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
        })

        it('should emit Rebase with 0 requestedSupplyAdjustment', async() => {
            const log = r.events[6]
            expect(log.event).to.equal('LogRebase')
            log.args.requestedSupplyAdjustment.should.equal(0)
        })
    })
})

describe('XdefTokenMonetaryPolicy:Rebase', async() => {
    let rbTime, rbWindow, minRebaseTimeIntervalSec, now, prevRebaseTime, nextRebaseWindowOpenTime,
        timeToWait, lastRebaseTimestamp

    beforeEach('setup XdefTokenMonetaryPolicy contract', async() => {
        await setupContracts()
        await awaitTx(xdefTokenMonetaryPolicy.setRebaseTimingParameters(86400, 72000, 900))
        rbTime = await xdefTokenMonetaryPolicy.rebaseWindowOffsetSec()
        rbWindow = await xdefTokenMonetaryPolicy.rebaseWindowLengthSec()
        minRebaseTimeIntervalSec = await xdefTokenMonetaryPolicy.minRebaseTimeIntervalSec()
        now = BigNumber.from(await currentTime(p))
        prevRebaseTime = now.sub(now.mod(minRebaseTimeIntervalSec)).add(rbTime)
        nextRebaseWindowOpenTime = prevRebaseTime.add(minRebaseTimeIntervalSec)
    })

    describe('when its 5s after the rebase window closes', () => {
        it('should fail', async() => {
            timeToWait = nextRebaseWindowOpenTime.sub(now).add(rbWindow).add(5)
            await waitForSomeTime(p, timeToWait.toNumber())
            await mockExternalData(INITIAL_RATE, INITIAL_TVL, 1000)
            expect(await xdefTokenMonetaryPolicy.inRebaseWindow()).to.be.false
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.true
        })
    })

    describe('when its 5s before the rebase window opens', () => {
        it('should fail', async() => {
            timeToWait = nextRebaseWindowOpenTime.sub(now).sub(5)
            await waitForSomeTime(p, timeToWait.toNumber())
            await mockExternalData(INITIAL_RATE, INITIAL_TVL, 1000)
            expect(await xdefTokenMonetaryPolicy.inRebaseWindow()).to.be.false
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.true
        })
    })

    describe('when its 5s after the rebase window opens', () => {
        it('should NOT fail', async() => {
            timeToWait = nextRebaseWindowOpenTime.sub(now).add(5)
            await waitForSomeTime(p, timeToWait.toNumber());
            await mockExternalData(INITIAL_RATE, INITIAL_TVL, 1000);
            expect(await xdefTokenMonetaryPolicy.inRebaseWindow()).to.be.true;
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.false;
            lastRebaseTimestamp = await xdefTokenMonetaryPolicy.lastRebaseTimestampSec()
            expect(lastRebaseTimestamp.eq(nextRebaseWindowOpenTime)).to.be.true
        })
    })

    describe('when its 5s before the rebase window closes', () => {
        it('should NOT fail', async() => {
            timeToWait = nextRebaseWindowOpenTime.sub(now).add(rbWindow).sub(5)
            await waitForSomeTime(p, timeToWait.toNumber())
            await mockExternalData(INITIAL_RATE, INITIAL_TVL, 1000)
            expect(await xdefTokenMonetaryPolicy.inRebaseWindow()).to.be.true
            expect(
                await isEthException(xdefTokenMonetaryPolicy.connect(orchestrator).rebase())
            ).to.be.false
            lastRebaseTimestamp = await xdefTokenMonetaryPolicy.lastRebaseTimestampSec()
            expect(lastRebaseTimestamp.eq(nextRebaseWindowOpenTime)).to.be.true
        })
    })
})