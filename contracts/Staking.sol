// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.0 <0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';

/**
 * @dev Taraxa Staking Contract
 *
 * The Staking Contract is used to lock TARA tokens.
 *
 * The rewards that the participants get for locking their tokens
 * are calculated by an external service based on the events that
 * this contract emits.
 */

contract Staking is Ownable {
    using SafeMath for uint256;

    IERC20 token;
    uint256 public lockingPeriod = 30 days;

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
    }
    mapping(address => Stake) private stakes;

    /**
     * @dev Sets the value for {token}
     *
     * The token is immutable. It can only be set once during
     * construction.
     */
    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    /**
     * @dev Sets how long it takes until a users can withdraw
     * their tokens
     */
    function setLockingPeriod(uint256 _lockingPeriod) public onlyOwner {
        lockingPeriod = _lockingPeriod;
    }

    /**
     * @dev Sets how long it takes until a users can withdraw
     * their tokens
     */
    function stakeOf(address _user)
        public
        view
        returns (
            uint256 amount,
            uint256 startTime,
            uint256 endTime
        )
    {
        Stake storage s = stakes[_user];
        return (s.amount, s.startTime, s.endTime);
    }

    function stake(uint256 _amount) public {
        require(_amount > 0, 'Staking: Amount cannot be zero');

        require(token.transferFrom(_msgSender(), address(this), _amount));

        uint256 startTime = block.timestamp;
        uint256 endTime = block.timestamp.add(lockingPeriod);

        Stake storage currentStake = stakes[_msgSender()];
        if (currentStake.startTime > 0) {
            currentStake.amount = currentStake.amount.add(_amount);
            currentStake.endTime = endTime;
            startTime = currentStake.startTime;
        } else {
            Stake memory newStake = Stake(_amount, startTime, endTime);
            stakes[_msgSender()] = newStake;
        }

        emit Deposited(_msgSender(), _amount, startTime, endTime);
    }

    function unstake() public {
        Stake storage currentStake = stakes[_msgSender()];
        require(currentStake.amount > 0, 'Staking: No stake to withdraw');
        require(
            block.timestamp >= currentStake.endTime,
            'Staking: Cannot unstake before locking period ends'
        );

        uint256 amount = currentStake.amount;
        currentStake.amount = 0;

        require(token.transfer(_msgSender(), amount));
        emit Withdrawn(_msgSender(), currentStake.amount);
    }

    event Deposited(address indexed user, uint256 amount, uint256 startTime, uint256 endTime);
    event Withdrawn(address indexed user, uint256 amount);
}
