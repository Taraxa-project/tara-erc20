// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.0 <0.8.0;

import '@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol';

/**
 * @dev Taraxa Staking Contract
 *
 * The Staking Contract is used to lock TARA tokens.
 *
 * The rewards that the participants get for locking their tokens
 * are calculated by an external service based on the events that
 * this contract emits.
 */

contract StakingProxy is TransparentUpgradeableProxy {
    constructor(
        address _logic,
        address admin_,
        bytes memory _data
    ) payable TransparentUpgradeableProxy(_logic, admin_, _data) {}
}
