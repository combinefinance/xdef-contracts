pragma solidity 0.6.12;

import "../XdefTokenOrchestrator.sol";


contract ConstructorRebaseCallerContract {
    constructor(address orchestrator) public {
        // Take out a flash loan.
        // Do something funky...
        XdefTokenOrchestrator(orchestrator).rebase();  // should fail
        // pay back flash loan.
    }
}
