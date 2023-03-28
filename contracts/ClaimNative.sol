// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

/**
 * @dev Taraxa Claim Contract Native Version
 */
contract ClaimNative {
    address trustedAccountAddress;

    mapping(bytes32 => uint256) claimed;

    /**
     * @dev Sets the values for {trustedAccountAddress}.
     * The account address is used to validate claim signatures.
     *
     * This value is immutable: it can only be set once during
     * construction.
     * In addition, since we transfer native tokens here, we need to fund the contract.
     */
    constructor(address _trustedAccountAddress) payable {
        trustedAccountAddress = _trustedAccountAddress;
    }

    /**
     * @dev Returns the number of tokens that have been claimed by the
     * participant.
     *
     * Used by the Claim UI app.
     */
    function getClaimedAmount(
        address _address,
        uint256 _value,
        uint256 _nonce
    ) public view returns (uint256) {
        bytes32 hash = _hash(_address, _value, _nonce);
        return claimed[hash];
    }

    /**
     * @dev Transfers the tokens from a Taraxa owned wallet to the participant.
     *
     * Emits a {Claimed} event.
     */
    function claim(
        address payable _address,
        uint256 _value,
        uint256 _nonce,
        bytes memory _sig
    ) public {
        bytes32 hash = _hash(_address, _value, _nonce);

        require(ECDSA.recover(hash, _sig) == trustedAccountAddress, 'Claim: Invalid signature');
        require(claimed[hash] == 0, 'Claim: Already claimed');

        claimed[hash] = _value;
        _address.transfer(_value);

        emit Claimed(_address, _nonce, _value);
    }

    function _hash(
        address _address,
        uint256 _value,
        uint256 _nonce
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_address, _value, _nonce));
    }

    /**
     * @dev Emitted after the tokens have been transfered to the participant.
     */
    event Claimed(address indexed _address, uint256 indexed _nonce, uint256 _value);
}
