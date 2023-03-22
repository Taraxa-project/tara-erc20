// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import '@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol';

contract StakingProxyAdmin is ProxyAdmin {
    constructor() ProxyAdmin() {}
}
