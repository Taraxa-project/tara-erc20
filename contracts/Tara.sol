//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 <0.8.0;

import "./ERC20Pauser.sol";

contract Tara is ERC20Pauser {
    constructor() ERC20Pauser("Taraxa Coin", "TARA") {
        _mint(_msgSender(), 1000000000);
    }
}