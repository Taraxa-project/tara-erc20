// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.0 <0.8.0;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/**
 * @dev Taraxa Multisend Contract
 *
 * The Multisend Contract is used to do multiple ERC20 token transfers in the same transaction
 */
contract Multisend {
    using SafeMath for uint256;

    /**
     * @dev Transfers the tokens from a Taraxa owned wallet to the participant.
     *
     * Emits a {TokensSent} event.
     */
    function multisendToken(
        address token,
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) public {
        require(_recipients.length <= 200, 'Multisend: max transfers per tx exceeded');
        require(
            _recipients.length == _amounts.length,
            'Multisend: contributors and balances have different sizes'
        );

        uint256 total = 0;
        IERC20 erc20token = IERC20(token);
        uint8 i = 0;
        for (i; i < _recipients.length; i++) {
            erc20token.transferFrom(msg.sender, _recipients[i], _amounts[i]);
            total += _amounts[i];
        }
        emit TokensSent(total, token);
    }

    /**
     * @dev Emitted after all the tokens have been transfered.
     */
    event TokensSent(uint256 total, address tokenAddress);
}
