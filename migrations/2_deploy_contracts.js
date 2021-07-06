const Tara = artifacts.require('./Tara.sol');
const Claim = artifacts.require('./Claim.sol');
const Staking = artifacts.require('./Staking.sol');
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

  await deployer.deploy(Staking);
  let staking = await Staking.deployed();
  await staking.initialize(token.address);

  let proxy;
  let isProxyDeployed = await StakingProxy.isDeployed();
  if (isProxyDeployed) {
    proxy = await StakingProxy.deployed();
    await proxy.upgradeTo(staking.address);
  } else {
    await deployer.deploy(StakingProxy, staking.address, accounts[0], '0x');
    proxy = await StakingProxy.deployed();
  }
};
