pragma solidity 0.6.12;

//import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";

import "./ERC20UpgradeSafe.sol";

contract LPToken is ERC20UpgradeSafe {

    function initialize()
        public
        initializer
    {
        __ERC20_init("lpToken for Xdef", "lpToken");
        _setupDecimals(uint8(18));

    }

}
