const Claim = artifacts.require("./Claim.sol"),
  Tara = artifacts.require("./Tara.sol"),
  ethUtil = require("ethereumjs-util"),
  abi = require("ethereumjs-abi"),
  BigNumber = web3.BigNumber,
  truffleAssert = require("truffle-assertions");

require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

contract("Claim", function (accounts) {
  const walletAddress = accounts[0],
    trustedAddress = accounts[1],
    privateKey = Buffer.from(process.env.TRUSTED_ACCOUNT, "hex"),
    clientAddress = accounts[2],
    balance = 124;

  beforeEach(async function () {
    this.token = await Tara.new({ from: walletAddress });
    this.contract = await Claim.new(
      this.token.address,
      trustedAddress,
      walletAddress
    );

    await this.token.approve(this.contract.address, balance);
  });

  it("transfers tokens if the signature is valid", async function () {
    var encoded = abi.soliditySHA3(
      ["address", "uint"],
      [clientAddress, balance]
    );

    let { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    let hash = ethUtil.toRpcSig(v, r, s);

    await this.contract.claim(clientAddress, balance, hash);

    const newBalance = await this.token.balanceOf(clientAddress);
    newBalance
      .toNumber()
      .should.be.equal(balance, "The balance should be " + balance);
  });

  it("doesn't transfer tokens if the signature is invalid", async function () {
    var encoded = abi.soliditySHA3(
      ["address", "uint"],
      [clientAddress, balance - 1]
    );

    let { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    let hash = ethUtil.toRpcSig(v, r, s);

    await truffleAssert.reverts(
      this.contract.claim(clientAddress, balance, hash),
      "Claim: Invalid signature"
    );
  });

  it("doesn't transfer tokens if already claimed", async function () {
    var encoded = abi.soliditySHA3(
      ["address", "uint"],
      [clientAddress, balance]
    );

    let { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    let hash = ethUtil.toRpcSig(v, r, s);

    this.contract.claim(clientAddress, balance, hash);
    await truffleAssert.reverts(
      this.contract.claim(clientAddress, balance, hash),
      "Claim: Already claimed"
    );
  });

  it("is able to check claimed amount", async function () {
    const initialBalance = await this.contract.getClaimedAmount(clientAddress);
    initialBalance
      .toNumber()
      .should.be.equal(0, "The initial balance should be 0");

    var encoded = abi.soliditySHA3(
      ["address", "uint"],
      [clientAddress, balance]
    );


    let { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    let hash = ethUtil.toRpcSig(v, r, s);

    this.contract.claim(clientAddress, balance, hash);

    const newBalance = await this.contract.getClaimedAmount(clientAddress);
    newBalance
      .toNumber()
      .should.be.equal(balance, "The balance should be " + balance);
  });
});
