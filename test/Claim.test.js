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
    otherAddress = accounts[3],
    balance = 124,
    nonce = 333;

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
      ["address", "uint", "uint"],
      [clientAddress, balance, nonce]
    );

    let { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    let hash = ethUtil.toRpcSig(v, r, s);

    await this.contract.claim(clientAddress, balance, nonce, hash);

    const newBalance = await this.token.balanceOf(clientAddress);
    newBalance
      .toNumber()
      .should.be.equal(balance, "The balance should be " + balance);
  });

  it("can claim tokens for other party if signature is valid", async function () {
    var encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, nonce]
    );

    let { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    let hash = ethUtil.toRpcSig(v, r, s);

    await this.contract.claim(clientAddress, balance, nonce, hash, {
      from: otherAddress,
    });

    const newBalance = await this.token.balanceOf(clientAddress);
    newBalance
      .toNumber()
      .should.be.equal(balance, "The balance should be " + balance);

    const otherPartyBalance = await this.token.balanceOf(otherAddress);
    otherPartyBalance.toNumber().should.be.equal(0, "The balance should be 0");
  });

  it("can claim multiple times with different signatures", async function () {
    await this.token.approve(this.contract.address, balance * 2);

    var encoded1 = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, 1]
    );
    let { v: v1, r: r1, s: s1 } = ethUtil.ecsign(encoded1, privateKey);
    let hash1 = ethUtil.toRpcSig(v1, r1, s1);
    await this.contract.claim(clientAddress, balance, 1, hash1);

    var encoded2 = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, 2]
    );
    let { v: v2, r: r2, s: s2 } = ethUtil.ecsign(encoded2, privateKey);
    let hash2 = ethUtil.toRpcSig(v2, r2, s2);
    await this.contract.claim(clientAddress, balance, 2, hash2);

    const newBalance = await this.token.balanceOf(clientAddress);
    newBalance
      .toNumber()
      .should.be.equal(balance * 2, "The balance should be " + balance);
  });

  it("doesn't transfer tokens if the signature is invalid", async function () {
    var encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance - 1, nonce]
    );

    let { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    let hash = ethUtil.toRpcSig(v, r, s);

    await truffleAssert.reverts(
      this.contract.claim(clientAddress, balance, nonce, hash),
      "Claim: Invalid signature"
    );
  });

  it("doesn't transfer tokens if already claimed", async function () {
    var encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, nonce]
    );

    let { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    let hash = ethUtil.toRpcSig(v, r, s);

    this.contract.claim(clientAddress, balance, nonce, hash);
    await truffleAssert.reverts(
      this.contract.claim(clientAddress, balance, nonce, hash),
      "Claim: Already claimed"
    );
  });

  it("is able to check claimed amount", async function () {
    const initialBalance = await this.contract.getClaimedAmount(clientAddress);
    initialBalance
      .toNumber()
      .should.be.equal(0, "The initial balance should be 0");

    var encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, nonce]
    );

    let { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    let hash = ethUtil.toRpcSig(v, r, s);

    this.contract.claim(clientAddress, balance, nonce, hash);

    const newBalance = await this.contract.getClaimedAmount(clientAddress);
    newBalance
      .toNumber()
      .should.be.equal(balance, "The balance should be " + balance);
  });
});
