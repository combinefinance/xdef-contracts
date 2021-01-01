pragma solidity 0.6.12;

import "./lib/UsingTellor.sol";

contract TvlOracle is UsingTellor {

  //This Contract now have access to all functions on UsingTellor

  uint256 requestId;
  uint8   public externalOracleDecimals;
  uint8   public desiredDecimals;

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

    //(_didGet, _value, _timestamp) = getCurrentValue(requestId);
    (_didGet, _value, _timestamp) = getDataBefore(requestId, now - 30 minutes);
    _value = _value * (10 ** (uint256(desiredDecimals - externalOracleDecimals)));
    return (_value, _didGet);
  }
}
