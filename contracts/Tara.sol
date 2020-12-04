//SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract Tara is ERC20PresetMinterPauser {
    constructor(uint256 initialSupply) ERC20PresetMinterPauser("Taraxa Coin", "TARA") {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Transfer the tokens from sender to all the address provided in the array.
    /// @dev Left 160 bits are the recipient address and the right 96 bits are the token amount.
    /// @param bits array of uint
    /// @return true/false
    function multiTransfer(
        uint256[] calldata bits
    ) external returns (bool) {
        uint256 totalOut = 0;

        // calculate total out
        for (uint256 i = 0; i < bits.length; i++) {
            uint256 amount = bits[i] & ((1 << 96) - 1);
            totalOut += amount;
        }

        require(this.balanceOf(msg.sender) >= totalOut, "Insufficient balance");

        // output amount to recipients
        for (uint256 i = 0; i < bits.length; i++) {
            address a = address(bits[i] >> 96);
            uint256 amount = bits[i] & ((1 << 96) - 1);
            this.transferFrom(msg.sender, a, amount);
        }

        return true;
    }
}