pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleOracle is Ownable {
    uint256 private _value;
    
    event LogValueUpdate(uint256 v);

    function getData()
        public
        view
        returns (uint256, bool)
    {
        return (_value, true);
    }

    // Methods to mock data on the chain
    function storeData(uint256 value)
        external
        onlyOwner
    {
        _value = value;
        emit LogValueUpdate(value);
    }
}
