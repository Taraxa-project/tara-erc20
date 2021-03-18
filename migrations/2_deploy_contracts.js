const Tara = artifacts.require('./Tara.sol');
const Claim = artifacts.require('./Claim.sol');

module.exports = async (deployer, network, accounts) => {
  const walletAddress = accounts[0],
    trustedAddress = accounts[1];

  await deployer.deploy(Tara, "10000000000000000000000000000");
  let token = await Tara.deployed();
  let balance = await token.balanceOf(walletAddress);

  await deployer.deploy(Claim, token.address, trustedAddress, walletAddress);
  let claim = await Claim.deployed();

  await token.approve(claim.address, balance);
};
