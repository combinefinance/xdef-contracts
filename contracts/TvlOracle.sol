// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";

interface ITellorLens {
      function getDataBefore(uint256 _requestId, uint256 _timestamp)
        external
        view
      returns (bool _ifRetrieve, uint256 _value, uint256 _timestampRetrieved);
}

contract TvlOracle is Ownable {

  //This Contract now have access to all functions on UsingTellor

  uint256 requestId;
  uint256 public delay = 1 hours;
  uint256 public maxAge = 5 hours;
  ITellorLens tellorLens;

  constructor(address payable _tellorLensAddress, uint256 _requestId) 
    public 
  {
    tellorLens = ITellorLens(_tellorLensAddress);
    requestId = _requestId;
  }

  function getData() 
    public 
    view
    returns (uint256, bool)
  {

    (bool _didGet, uint256 _value, uint256 _timestamp) = tellorLens.getDataBefore(requestId, now - delay);

    _value = _value * 1e12; // Tellor gives us 6 decimals, we need 18
    bool dataIsFresh = now - _timestamp < maxAge;

    return (_value, _didGet && dataIsFresh);
  }

  function setDelay(uint256 newDelay) 
    external 
    onlyOwner 
  {
    delay = newDelay;
  }

  function setMaxAge(uint256 newMaxAge) 
    external 
    onlyOwner 
  {
    maxAge = newMaxAge;
  }
}
