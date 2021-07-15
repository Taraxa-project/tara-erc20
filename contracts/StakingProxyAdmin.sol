// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.0 <0.8.0;

import '@openzeppelin/contracts/proxy/ProxyAdmin.sol';

contract StakingProxyAdmin is ProxyAdmin {
    constructor() ProxyAdmin() {}
}
