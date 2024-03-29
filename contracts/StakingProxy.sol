// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.7.6;

import '@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol';

contract StakingProxy is TransparentUpgradeableProxy {
    constructor(
        address _logic,
        address admin_,
        bytes memory _data
    ) payable TransparentUpgradeableProxy(_logic, admin_, _data) {}
}
