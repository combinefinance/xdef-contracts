pragma solidity 0.6.12;

import "./Mock.sol";


contract MockXdefTokenMonetaryPolicy is Mock {

    function rebase() external {
        emit FunctionCalled("XdefTokenMonetaryPolicy", "rebase", msg.sender);
    }
}
