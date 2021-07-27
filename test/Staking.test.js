const Staking = artifacts.require('./Staking.sol'),
  StakingProxyAdmin = artifacts.require('./StakingProxyAdmin.sol'),
  StakingProxy = artifacts.require('./StakingProxy.sol'),
  Tara = artifacts.require('./Tara.sol'),
  BigNumber = web3.BigNumber,
  truffleAssert = require('truffle-assertions');

require('chai').use(require('chai-as-promised')).use(require('chai-bignumber')(BigNumber)).should();

contract('Staking', (accounts) => {
  const ownerAddress = accounts[0],
    otherAddress = accounts[1],
    userAddress = accounts[2];

  before(async () => {
    this.proxyAdmin = await StakingProxyAdmin.new();
  });
  beforeEach(async () => {
    this.logic = await Staking.new();
    this.token = await Tara.new(1000000000);
    this.proxy = await StakingProxy.new(this.logic.address, this.proxyAdmin.address, '0x');
    this.contract = await Staking.at(this.proxy.address);
    await this.contract.initialize(this.token.address);
  });

  describe('Anyone', async () => {
    it('has a default locking period of 30 days', async () => {
      const lockingPeriod = await this.contract.lockingPeriod();
      lockingPeriod
        .toNumber()
        .should.be.equal(30 * 24 * 60 * 60, 'The default locking period is incorrect');
    });
    it('can get the staking data for any user', async () => {
      const numberOfTokens = 54321;
      await this.token.transfer(userAddress, numberOfTokens, { from: ownerAddress });
      await this.token.approve(this.contract.address, numberOfTokens, { from: userAddress });

      const tx = await this.contract.stake(numberOfTokens, { from: userAddress });
      const block = await web3.eth.getBlock(tx.receipt.blockNumber);

      const lockingPeriod = await this.contract.lockingPeriod();
      const stake = await this.contract.stakeOf(userAddress);
      stake.amount.toNumber().should.be.equal(numberOfTokens, 'The stake amount is incorrect');
      stake.startTime.toNumber().should.be.equal(block.timestamp, 'The start time is incorrect');
      stake.endTime
        .toNumber()
        .should.be.equal(block.timestamp + lockingPeriod.toNumber(), 'The end time is incorrect');
    });
  });

  describe('Owner', async () => {
    it('changes the locking period if owner', async () => {
      const newLockingPeriod = 15 * 24 * 60 * 60;

      const result = await this.contract.setLockingPeriod(newLockingPeriod, { from: ownerAddress });

      const lockingPeriod = await this.contract.lockingPeriod();
      lockingPeriod
        .toNumber()
        .should.be.equal(newLockingPeriod, 'The new locking period is incorrect');

      truffleAssert.eventEmitted(
        result,
        'ChangedLockingPeriod',
        (ev) => ev.lockingPeriod.toNumber() === newLockingPeriod
      );
    });
    it("doesn't change the locking period if not owner", async () => {
      await truffleAssert.reverts(
        this.contract.setLockingPeriod(1, { from: otherAddress }),
        'Staking: caller is not the owner'
      );
    });
    it('upgrades contract logic if owner', async () => {
      const newLogic = await Staking.new();
      await this.proxyAdmin.upgrade(this.proxy.address, newLogic.address);
      const currentLogicAddress = await this.proxyAdmin.getProxyImplementation(this.proxy.address);
      currentLogicAddress.should.be.equal(newLogic.address, 'The new logic was not set');
    });
    it("doesn't upgrades contract logic if not owner", async () => {
      const newLogic = await Staking.new();
      await truffleAssert.reverts(
        this.proxyAdmin.upgrade(this.proxy.address, newLogic.address, { from: otherAddress }),
        'Ownable: caller is not the owner'
      );
    });
  });

  describe('User', async () => {
    it('stakes tokens successfully', async () => {
      const numberOfTokens = 1000;
      await this.token.transfer(userAddress, numberOfTokens, { from: ownerAddress });
      await this.token.approve(this.contract.address, numberOfTokens, { from: userAddress });

      await this.contract.stake(numberOfTokens, { from: userAddress });

      const stake = await this.contract.stakeOf(userAddress);
      stake.amount.toNumber().should.be.equal(numberOfTokens, 'The stake amount is incorrect');
    });
    it('fails if stake is called with zero amount', async () => {
      await truffleAssert.reverts(
        this.contract.stake(0, { from: userAddress }),
        'Staking: Amount cannot be zero'
      );
    });
    it("fails to stake if allowance wasn't approved", async () => {
      await this.token.transfer(userAddress, 1, { from: ownerAddress });
      await truffleAssert.reverts(
        this.contract.stake(1, { from: userAddress }),
        'ERC20: transfer amount exceeds allowance'
      );
    });
    it('can stake multiple times', async () => {
      const numberOfTokens = 12345;
      await this.token.transfer(userAddress, numberOfTokens * 3, { from: ownerAddress });
      await this.token.approve(this.contract.address, numberOfTokens * 3, { from: userAddress });

      await this.contract.stake(numberOfTokens, { from: userAddress });
      await this.contract.stake(numberOfTokens, { from: userAddress });
      await this.contract.stake(numberOfTokens, { from: userAddress });

      const stake = await this.contract.stakeOf(userAddress);
      stake.amount.toNumber().should.be.equal(numberOfTokens * 3, 'The stake amount is incorrect');
    });
    it('can unstake previously staked tokens', async () => {
      const numberOfTokens = 9877;
      await this.token.transfer(userAddress, numberOfTokens, { from: ownerAddress });
      await this.token.approve(this.contract.address, numberOfTokens, { from: userAddress });

      const tx = await this.contract.stake(numberOfTokens, { from: userAddress });
      const stakeBlock = await web3.eth.getBlock(tx.receipt.blockNumber);

      const intermediateBalance = await this.token.balanceOf(userAddress);
      intermediateBalance
        .toNumber()
        .should.be.equal(0, 'The intermediate token balance is incorrect');

      const lockingPeriod = await this.contract.lockingPeriod();
      await advanceBlockAtTime(stakeBlock.timestamp + lockingPeriod.toNumber());

      await this.contract.unstake({ from: userAddress });

      const finalBalance = await this.token.balanceOf(userAddress);
      finalBalance
        .toNumber()
        .should.be.equal(numberOfTokens, 'The final token balance is incorrect');
    });
    it('fails if you want to unstake an inexisting stake', async () => {
      await truffleAssert.reverts(
        this.contract.unstake({ from: userAddress }),
        'Staking: No stake to withdraw'
      );
    });
    it('fails if you want to unstake before the locking period ends', async () => {
      const numberOfTokens = 12345;
      await this.token.transfer(userAddress, numberOfTokens, { from: ownerAddress });
      await this.token.approve(this.contract.address, numberOfTokens, { from: userAddress });

      await this.contract.stake(numberOfTokens, { from: userAddress });

      await truffleAssert.reverts(
        this.contract.unstake({ from: userAddress }),
        'Staking: Cannot unstake before locking period'
      );
    });
  });
});

const advanceBlockAtTime = (time) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [time],
        id: new Date().getMilliseconds(),
      },
      (err, _) => {
        if (err) {
          return reject(err);
        }
        const newBlockHash = web3.eth.getBlock('latest').hash;

        return resolve(newBlockHash);
      }
    );
  });
};
