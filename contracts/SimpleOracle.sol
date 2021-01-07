pragma solidity 0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";

contract SimpleOracle is OwnableUpgradeSafe {
    uint256 private _value;
    
    constructor() 
        public 
    {
        __Ownable_init();
    }

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
    }
}
