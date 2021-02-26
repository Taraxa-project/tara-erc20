// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.8.0;

import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import './Tara.sol';

contract Claim {
    event Claimed(address indexed _address, uint256 indexed _nonce, uint256 _value);

    Tara token;

    address trustedAccountAddress;
    address walletAddress;

    mapping(bytes32 => uint256) claimed;

    constructor(
        address _tokenAddress,
        address _trustedAccountAddress,
        address _walletAddress
    ) {
        token = Tara(_tokenAddress);

        trustedAccountAddress = _trustedAccountAddress;
        walletAddress = _walletAddress;
    }

    function getClaimedAmount(
        address _address,
        uint256 _value,
        uint256 _nonce
    ) public view returns (uint256) {
        bytes32 _hash = keccak256(abi.encodePacked(_address, _value, _nonce));
        return claimed[_hash];
    }

    function claim(
        address _address,
        uint256 _value,
        uint256 _nonce,
        bytes memory _sig
    ) public {
        bytes32 _hash = keccak256(abi.encodePacked(_address, _value, _nonce));

        require(ECDSA.recover(_hash, _sig) == trustedAccountAddress, 'Claim: Invalid signature');
        require(claimed[_hash] == 0, 'Claim: Already claimed');

        claimed[_hash] = _value;
        token.transferFrom(walletAddress, _address, _value);

        emit Claimed(_address, _nonce, _value);
    }
}
