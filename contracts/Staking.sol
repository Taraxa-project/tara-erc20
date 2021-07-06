// SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.6.0 <0.8.0;

import '@openzeppelin/contracts/proxy/Initializable.sol';
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

contract Staking is Initializable {
    address private _owner;

    using SafeMath for uint256;

    IERC20 token;
    uint256 public lockingPeriod;

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
    function initialize(address _tokenAddress) public initializer {
        _owner = msg.sender;

        lockingPeriod = 30 days;
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

        require(token.transferFrom(msg.sender, address(this), _amount));

        uint256 startTime = block.timestamp;
        uint256 endTime = block.timestamp.add(lockingPeriod);

        Stake storage currentStake = stakes[msg.sender];
        if (currentStake.startTime > 0) {
            currentStake.amount = currentStake.amount.add(_amount);
            currentStake.endTime = endTime;
            startTime = currentStake.startTime;
        } else {
            Stake memory newStake = Stake(_amount, startTime, endTime);
            stakes[msg.sender] = newStake;
        }

        emit Deposited(msg.sender, _amount, startTime, endTime);
    }

    function unstake() public {
        Stake storage currentStake = stakes[msg.sender];
        require(currentStake.amount > 0, 'Staking: No stake to withdraw');
        require(
            block.timestamp >= currentStake.endTime,
            'Staking: Cannot unstake before locking period ends'
        );

        uint256 amount = currentStake.amount;
        currentStake.amount = 0;

        require(token.transfer(msg.sender, amount));
        emit Withdrawn(msg.sender, currentStake.amount);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == msg.sender, 'Ownable: caller is not the owner');
        _;
    }

    event Deposited(address indexed user, uint256 amount, uint256 startTime, uint256 endTime);
    event Withdrawn(address indexed user, uint256 amount);
}