//SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract Tara is ERC20PresetMinterPauser {
    constructor(uint256 initialSupply) public ERC20PresetMinterPauser("Taraxa Coin", "TARA") {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Transfer the tokens from sender to all the address provided in the array.
    /// @dev Left 160 bits are the recipient address and the right 96 bits are the token amount.
    /// @param bits array of uint
    /// @return true/false
    function multiTransfer(
        uint256 amountIn,
        uint256[] calldata bits
    ) external returns (bool) {
        require(amountIn != 0, "Input amount invalid");
        require(this.balanceOf(msg.sender) >= amountIn, "Insufficient balance");

        uint256 totalOut = 0;

        for (uint256 i = 0; i < bits.length; i++) {
            uint256 amount = bits[i] & ((1 << 96) - 1);
            totalOut += amount;
        }

        require(amountIn == totalOut, "Output amt must equal input amt");

        // output amount to recipients
        for (uint256 i = 0; i < bits.length; i++) {
            address a = address(bits[i] >> 96);
            uint256 amount = bits[i] & ((1 << 96) - 1);
            this.transferFrom(msg.sender, a, amount);
        }

        return true;
    }
}