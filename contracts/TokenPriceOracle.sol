pragma solidity 0.6.12;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

interface IUniswapV2Pair {
  function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

contract TokenPriceOracle is Ownable {
    using SafeMath for uint256;
    using SafeMath for uint112;
    uint256 private _value;
    uint256 public timestamp;
    uint256 private constant MAX_AGE = 1 hours;

    event LogValueUpdate(uint256 v);

    function getData()
        public
        view
        returns (uint256, bool)
    {
        return (_value, now-timestamp < MAX_AGE);
    }

    // Methods to mock data on the chain
    function storeData()
        external
        onlyOwner
    {
        _value = calcPrice();
        timestamp = now;
        emit LogValueUpdate(_value);
    }

    function calcPrice() public view returns (uint256) {
        (uint112 Uusd, uint112 Ueth, uint32 bn) = IUniswapV2Pair(0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc).getReserves(); // USDC-ETH
        uint256 ethPrice = Uusd.mul(1e21).div(Ueth);
        (uint112 xdef, uint112 eth, uint32 hz) = IUniswapV2Pair(0xB2D0cad27830D78e95313EF6b3A5383406AE77dA).getReserves(); // XDEF-ETH
        uint256 xdefPrice = ethPrice.mul(eth).div(xdef);
        return xdefPrice;
    }
}