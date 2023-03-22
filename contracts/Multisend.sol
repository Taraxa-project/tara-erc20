// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
abstract contract ERC20Basic {
    function totalSupply() public virtual returns (uint256);

    function balanceOf(address who) public virtual returns (uint256);

    function transfer(address to, uint256 value) public virtual;
}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
abstract contract ERC20 is ERC20Basic {
    function allowance(address owner, address spender) public virtual returns (uint256);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual;

    function approve(address spender, uint256 value) public virtual;
}

/**
 * @dev Taraxa Multisend Contract
 *
 * The Multisend Contract is used to do multiple ERC20 token transfers in the same transaction
 */
contract Multisend {
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
        ERC20 erc20token = ERC20(token);
        uint8 i = 0;
        for (i; i < _recipients.length; i++) {
            erc20token.transferFrom(msg.sender, _recipients[i], _amounts[i]);
            total = total + _amounts[i];
        }
        emit TokensSent(total, token);
    }

    /**
     * @dev Emitted after all the tokens have been transfered.
     */
    event TokensSent(uint256 total, address tokenAddress);
}
