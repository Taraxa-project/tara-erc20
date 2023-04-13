// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import '@openzepppelin/contracts/security/ReentrancyGuard.sol';

/**
 * @dev Taraxa Multisend Contract
 *
 * The Multisend Contract is used to do multiple native token transfers in the same transaction
 */
contract MultisendNative is ReentrancyGuard {
    /**
     * @dev Transfers the tokens from the method caller to the participant.
     * The method doesn't restrict the sender to strictly be abel to fill all the transactions
     * as it will simply end the loop once there isn't enough balance for the next transfer.
     *
     * Emits a {TokensSent} event.
     */
    function multisendToken(
        address payable[] calldata _recipients,
        uint256[] calldata _amounts
    ) public payable nonReentrant {
        require(_recipients.length <= 200, 'Multisend: max transfers per tx exceeded');
        require(
            _recipients.length == _amounts.length,
            'Multisend: contributors and balances have different sizes'
        );
        require(msg.value >= _amounts[0], "Multisend: Sent value doesn't cover first transaction");

        uint256 total = 0;
        uint8 i = 0;
        for (i; i < _recipients.length; ++i) {
            if ((msg.value - total) >= _amounts[i]) {
                _recipients[i].transfer(_amounts[i]);
                total = total + _amounts[i];
            } else {
                break;
            }
        }
        if (msg.value > total) {
            payable(msg.sender).transfer(msg.value - total);
            emit SentBack(msg.value - total);
        }
        emit TokensSent(i, total);
    }

    /**
     * @dev Emitted after all the tokens have been transfered.
     */
    event TokensSent(uint8 lastSentIndex, uint256 total);

    /**
     * @dev Emitted in case there are some tokens sent back.
     */
    event SentBack(uint256 amount);
}
