//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/presets/ERC20PresetFixedSupply.sol";

contract Tara is ERC20PresetFixedSupply {
    constructor() ERC20PresetFixedSupply("Taraxa Coin", "TARA", 1000000000, msg.sender) {}
}