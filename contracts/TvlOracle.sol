// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/UsingTellor.sol";


contract TvlOracle is UsingTellor, Ownable {

  //This Contract now have access to all functions on UsingTellor

  uint256 requestId;
  uint8   public externalOracleDecimals;
  uint8   public desiredDecimals;
  uint256 public delay = 30 minutes;
  uint256 public maxAge = 3 hours;

  constructor(address payable _tellorAddress, uint256 _requestId) UsingTellor(_tellorAddress) 
    public 
  {
    requestId = _requestId;
    externalOracleDecimals = 6;
    desiredDecimals = 18;
  }

  function getData() 
    public 
    view
    returns (uint256, bool)
  {
    bool _didGet;
    uint _timestamp;
    uint256 _value;

    (_didGet, _value, _timestamp) = getDataBefore(requestId, now - delay);

    _value = _value * (10 ** (uint256(desiredDecimals - externalOracleDecimals)));
    bool dataIsFresh = now - _timestamp < maxAge;

    return (_value, _didGet && dataIsFresh);
  }

  function setDelay(uint256 newDelay) 
    public 
    onlyOwner 
  {
    delay = newDelay;
  }

  function setMaxAge(uint256 newMaxAge) 
    public 
    onlyOwner 
  {
    maxAge = newMaxAge;
  }
}
