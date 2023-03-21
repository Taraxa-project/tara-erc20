const Tara = artifacts.require('./Tara.sol');
const Claim = artifacts.require('./Claim.sol');
const ClaimNative = artifacts.require('./ClaimNative.sol');
const Multisend = artifacts.require('./Multisend.sol');
const Staking = artifacts.require('./Staking.sol');
const StakingProxyAdmin = artifacts.require('./StakingProxyAdmin');
const StakingProxy = artifacts.require('./StakingProxy.sol');

module.exports = async (deployer, network, accounts) => {
  const walletAddress = accounts[0],
    trustedAddress = accounts[1];

  await deployer.deploy(Tara, '10000000000000000000000000000');
  let token = await Tara.deployed();
  let balance = await token.balanceOf(walletAddress);

  await deployer.deploy(Claim, token.address, trustedAddress, walletAddress);
  let claim = await Claim.deployed();

  await token.approve(claim.address, balance);

  await deployer.deploy(ClaimNative, trustedAddress, {
    from: accounts[0],
    value: '1000000000000000000',
  });
  let claimNative = await ClaimNative.deployed();

  await deployer.deploy(Multisend);

  let stakingProxyAdmin = await deployer.deploy(StakingProxyAdmin);

  await deployer.deploy(Staking);
  let stakingLogic = await Staking.deployed();

  await deployer.deploy(StakingProxy, stakingLogic.address, stakingProxyAdmin.address, '0x');
  let stakingProxy = await StakingProxy.deployed();

  let staking = await Staking.at(stakingProxy.address);
  await staking.initialize(token.address);
};
