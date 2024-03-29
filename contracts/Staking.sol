// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/**
 * @dev Taraxa Staking Contract
 *
 * The Staking Contract is used to lock TARA tokens.
 *
 * The rewards that the participants get for locking their tokens
 * are calculated by an external service based on the events that
 * this contract emits.
 */

contract Staking is Initializable {
    IERC20 token;
    address private owner;
    uint256 public lockingPeriod;

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
    }
    mapping(address => Stake) private stakes;

    /**
     * @dev Sets the value for {token} and default values
     *
     * The token is immutable. It can only be set once during
     * initialization.
     */
    function initialize(address _tokenAddress) external initializer {
        require(_tokenAddress != address(0), 'Staking: tokenAddress is a zero address');
        owner = msg.sender;
        token = IERC20(_tokenAddress);
        lockingPeriod = 30 days;
    }

    /**
     * @dev Sets how long it takes until a users can withdraw
     * their tokens
     */
    function setLockingPeriod(uint256 _lockingPeriod) external {
        require(owner == msg.sender, 'Staking: caller is not the owner');
        lockingPeriod = _lockingPeriod;
        emit ChangedLockingPeriod(lockingPeriod);
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

    function stake(uint256 _amount) external {
        require(_amount > 0, 'Staking: Amount cannot be zero');

        uint256 startTime = block.timestamp;
        uint256 endTime = block.timestamp + lockingPeriod;

        Stake storage currentStake = stakes[msg.sender];
        if (currentStake.startTime > 0) {
            currentStake.amount = currentStake.amount + _amount;
            currentStake.endTime = endTime;
            startTime = currentStake.startTime;
        } else {
            Stake memory newStake = Stake(_amount, startTime, endTime);
            stakes[msg.sender] = newStake;
        }

        emit Deposited(msg.sender, _amount, startTime, endTime);

        require(token.transferFrom(msg.sender, address(this), _amount));
    }

    function unstake() external {
        Stake storage currentStake = stakes[msg.sender];
        require(currentStake.amount > 0, 'Staking: No stake to withdraw');
        require(
            block.timestamp >= currentStake.endTime,
            'Staking: Cannot unstake before locking period ends'
        );

        uint256 amount = currentStake.amount;
        currentStake.amount = 0;

        emit Withdrawn(msg.sender, amount);

        require(token.transfer(msg.sender, amount));
    }

    event ChangedLockingPeriod(uint256 lockingPeriod);
    event Deposited(address indexed user, uint256 amount, uint256 startTime, uint256 endTime);
    event Withdrawn(address indexed user, uint256 amount);
}
