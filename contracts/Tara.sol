//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import '@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol';

contract Tara is ERC20PresetMinterPauser {
    constructor(uint256 initialSupply) ERC20PresetMinterPauser('Taraxa Coin', 'TARA') {
        _mint(_msgSender(), initialSupply);
    }
}
