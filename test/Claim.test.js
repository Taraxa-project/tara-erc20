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
    this.token = await Tara.new(1000000000, { from: walletAddress });
    this.contract = await Claim.new(
      this.token.address,
      trustedAddress,
      walletAddress
    );

    await this.token.approve(this.contract.address, balance);
  });

  it("transfers tokens if the signature is valid", async function () {
    const encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, nonce]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    await this.contract.claim(clientAddress, balance, nonce, hash);

    const newBalance = await this.token.balanceOf(clientAddress);
    newBalance
      .toNumber()
      .should.be.equal(balance, "The balance should be " + balance);
  });

  it("can claim tokens for other party if signature is valid", async function () {
    const encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, nonce]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

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

    const encoded1 = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, 1]
    );
    const { v: v1, r: r1, s: s1 } = ethUtil.ecsign(encoded1, privateKey);
    const hash1 = ethUtil.toRpcSig(v1, r1, s1);
    await this.contract.claim(clientAddress, balance, 1, hash1);

    const encoded2 = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, 2]
    );
    const { v: v2, r: r2, s: s2 } = ethUtil.ecsign(encoded2, privateKey);
    const hash2 = ethUtil.toRpcSig(v2, r2, s2);
    await this.contract.claim(clientAddress, balance, 2, hash2);

    const newBalance = await this.token.balanceOf(clientAddress);
    newBalance
      .toNumber()
      .should.be.equal(balance * 2, "The balance should be " + balance);
  });

  it("doesn't transfer tokens if the signature is invalid", async function () {
    const encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance - 1, nonce]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    await truffleAssert.reverts(
      this.contract.claim(clientAddress, balance, nonce, hash),
      "Claim: Invalid signature"
    );
  });

  it("doesn't transfer tokens if already claimed", async function () {
    const encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, nonce]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    this.contract.claim(clientAddress, balance, nonce, hash);
    await truffleAssert.reverts(
      this.contract.claim(clientAddress, balance, nonce, hash),
      "Claim: Already claimed"
    );
  });

  it("is able to check claimed amount", async function () {
    const initialBalance = await this.contract.getClaimedAmount(clientAddress, balance, nonce);
    initialBalance
      .toNumber()
      .should.be.equal(0, "The initial balance should be 0");

    const encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, nonce]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    this.contract.claim(clientAddress, balance, nonce, hash);

    const newBalance = await this.contract.getClaimedAmount(clientAddress, balance, nonce);
    newBalance
      .toNumber()
      .should.be.equal(balance, "The balance should be " + balance);
  });
  it("it reverts the transaction if the transfer fails", async function () {
    await this.token.approve(this.contract.address, 0);
    const encoded = abi.soliditySHA3(
      ["address", "uint", "uint"],
      [clientAddress, balance, nonce]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    await truffleAssert.reverts(
      this.contract.claim(clientAddress, balance, nonce, hash),
      "ERC20: transfer amount exceeds allowance"
    );

    const noChangeBalance = await this.contract.getClaimedAmount(clientAddress, balance, nonce);
    noChangeBalance
      .toNumber()
      .should.be.equal(0, "The balance should be 0");

    await this.token.approve(this.contract.address, balance);
    await this.contract.claim(clientAddress, balance, nonce, hash)

    const newBalance = await this.contract.getClaimedAmount(clientAddress, balance, nonce);
    newBalance
      .toNumber()
      .should.be.equal(balance, `The balance should be ${balance}`);
  });
});
