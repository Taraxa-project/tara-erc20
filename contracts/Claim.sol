// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.8.0;

import "./Tara.sol";

contract Claim {

    Tara token;

    address trustedAccountAddress;
    address walletAddress;

    mapping(address => uint) claimed;

    constructor(address _tokenAddress, address _trustedAccountAddress, address _walletAddress) {
        token = Tara(_tokenAddress);

        trustedAccountAddress = _trustedAccountAddress;
        walletAddress = _walletAddress;
    }

    function getClaimedAmount(address _address) public view returns (uint) {
        return claimed[_address];
    }

    function claim(address _address, uint _value, bytes memory _sig) public {
        bytes32 _r;
        bytes32 _s;
        uint8 _v;

        assembly {
            _r := mload(add(_sig, 32))
            _s := mload(add(_sig, 64))
            _v := byte(0, mload(add(_sig, 96)))
        }

        require(ecrecover(keccak256(abi.encodePacked(_address, _value)), _v, _r, _s) == trustedAccountAddress, "Claim: Invalid signature");
        require(claimed[_address] == 0, "Claim: Already claimed");

        claimed[_address] = _value;
        token.transferFrom(walletAddress, _address, _value);
        
        emit Claimed(_address, _value);
    }

    event Claimed(address indexed _address, uint _value);

}
