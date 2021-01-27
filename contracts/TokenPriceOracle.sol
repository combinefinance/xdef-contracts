pragma solidity =0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/lib/contracts/libraries/FixedPoint.sol';

import '@uniswap/v2-periphery/contracts/libraries/UniswapV2OracleLibrary.sol';

// fixed window oracle that recomputes the average price for the entire period once every period
// note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period
contract TokenPriceOracle is Ownable {
    using FixedPoint for *;

    address public monetaryPolicyAddress;
    address public xdefEthPairAddress;
    address public usdcEthPairAddress;
    uint    public XdefEthPrice0CumulativeLast;
    uint    public UsdcEthPrice1CumulativeLast;
    uint32  public blockTimestampLast;

    constructor(address _xdefEthPairAddress, address _usdcEthPairAddress) public {
        xdefEthPairAddress = _xdefEthPairAddress;
        usdcEthPairAddress = _usdcEthPairAddress;
        (XdefEthPrice0CumulativeLast, , blockTimestampLast) =
            UniswapV2OracleLibrary.currentCumulativePrices(xdefEthPairAddress);
        (, UsdcEthPrice1CumulativeLast, ) =
            UniswapV2OracleLibrary.currentCumulativePrices(usdcEthPairAddress);      
    }

    function update() external {
        require(msg.sender == monetaryPolicyAddress, "you are not the monetaryPolicy");
        (XdefEthPrice0CumulativeLast, , blockTimestampLast) =
            UniswapV2OracleLibrary.currentCumulativePrices(xdefEthPairAddress);
        (, UsdcEthPrice1CumulativeLast, ) =
            UniswapV2OracleLibrary.currentCumulativePrices(usdcEthPairAddress);
        
    }

    // note this will always return 0 before update has been called successfully for the first time.
    function getData() external view returns (uint256 value, bool isValid) {
        (uint XdefEthPrice0Cumulative, , uint32 blockTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(xdefEthPairAddress);
        ( ,uint UsdcEthPrice1Cumulative, ) =
            UniswapV2OracleLibrary.currentCumulativePrices(usdcEthPairAddress);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired
        // overflow is desired, casting never truncates
        // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
        FixedPoint.uq112x112 memory XdefEthPrice0Average = FixedPoint.uq112x112(uint224((XdefEthPrice0Cumulative - XdefEthPrice0CumulativeLast) / timeElapsed));
        FixedPoint.uq112x112 memory UsdcEthPrice1Average = FixedPoint.uq112x112(uint224((UsdcEthPrice1Cumulative - UsdcEthPrice1CumulativeLast) / timeElapsed));
        //price1Average = FixedPoint.uq112x112(uint224((price1Cumulative - price1CumulativeLast) / timeElapsed));
        
        uint256 ethPrice = UsdcEthPrice1Average.mul(1e21).decode144();
        value = XdefEthPrice0Average.mul(ethPrice).decode144();
        isValid = true;
    }

    function setMonetaryPolicy(address newPolicyAddress) 
        public 
        onlyOwner 
    {
        monetaryPolicyAddress = newPolicyAddress;
    }
}
