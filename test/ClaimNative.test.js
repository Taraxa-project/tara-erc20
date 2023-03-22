const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const ClaimNative = artifacts.require('./ClaimNative.sol'),
  ethUtil = require('ethereumjs-util'),
  abi = require('ethereumjs-abi'),
  BigNumber = web3.BigNumber,
  truffleAssert = require('truffle-assertions');

require('chai').use(require('chai-as-promised')).use(require('chai-bignumber')(BigNumber)).should();

let gasUsedRecords = [];
let gasUsedTotal = 0;

function recordGasUsed(tx, label) {
  gasUsedTotal += tx.receipt.gasUsed;
  gasUsedRecords.push(String(label + ' | GasUsed: ' + tx.receipt.gasUsed).padStart(80));
}

function printGasUsed() {
  console.group('Gas used');
  console.log('-'.repeat(80));
  for (let i = 0; i < gasUsedRecords.length; ++i) {
    console.log(gasUsedRecords[i]);
  }
  console.log(String('Total: ' + gasUsedTotal).padStart(80));
  console.log('-'.repeat(80));
  console.groupEnd();
}

contract('ClaimNative', function (accounts) {
  const trustedAddress = accounts[1],
    privateKey = Buffer.from(process.env.TRUSTED_ACCOUNT, 'hex'),
    clientAddress = accounts[2],
    otherAddress = accounts[3],
    balance = new web3.utils.BN(web3.utils.toWei('1')),
    nonce = 333;

  beforeEach(async function () {
    this.contract = await ClaimNative.new(trustedAddress, {
      from: accounts[0],
      value: balance.mul(new web3.utils.BN('10')),
    });
    const newBalance = await web3.eth.getBalance(this.contract.address);
    newBalance.should.be.equal(
      balance + '0',
      'The balance should be ' + balance.mul(new web3.utils.BN('10')).toString()
    );
  });

  after(async () => {
    printGasUsed();
  });

  it('transfers tokens if the signature is valid', async function () {
    const encoded = abi.soliditySHA3(
      ['address', 'uint256', 'uint256'],
      [clientAddress, balance, nonce]
    );
    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    console.log(`hash: ${hash}`);

    const balanceBefore = await web3.eth.getBalance(clientAddress);

    const tx = await this.contract.claim(clientAddress, balance, nonce, hash, {
      from: clientAddress,
    });
    recordGasUsed(tx, 'claim - transfers tokens if the signature is valid');

    const newBalance = await web3.eth.getBalance(clientAddress);
    Number(newBalance)
      .should.be.greaterThan(Number(balanceBefore))
      .and.lessThan(Number(balanceBefore) + Number(balance));
  });

  it('can claim tokens for other party if signature is valid', async function () {
    const encoded = abi.soliditySHA3(
      ['address', 'uint256', 'uint256'],
      [clientAddress, balance, nonce]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    const balanceBefore = await web3.eth.getBalance(clientAddress);
    const otherPartyBalanceBefore = await web3.eth.getBalance(otherAddress);

    const tx = await this.contract.claim(clientAddress, balance, nonce, hash, {
      from: otherAddress,
    });
    recordGasUsed(tx, 'claim - can claim tokens for other party if signature is valid');

    const newBalance = await web3.eth.getBalance(clientAddress);

    Number(newBalance).should.be.greaterThan(
      Number(balanceBefore),
      'The balance should be greater than before with 1 TARA - gas'
    );

    const otherPartyBalance = await web3.eth.getBalance(otherAddress);
    Number(otherPartyBalance).should.be.lessThan(
      Number(otherPartyBalanceBefore),
      'The balance should less than before for teh 3rd party because of gas costs'
    );
  });

  it('can claim multiple times with different signatures', async function () {
    const encoded1 = abi.soliditySHA3(
      ['address', 'uint256', 'uint256'],
      [clientAddress, balance, 1]
    );
    const { v: v1, r: r1, s: s1 } = ethUtil.ecsign(encoded1, privateKey);
    const hash1 = ethUtil.toRpcSig(v1, r1, s1);
    const balanceBefore = await web3.eth.getBalance(clientAddress);
    const tx1 = await this.contract.claim(clientAddress, balance, 1, hash1, {
      from: otherAddress,
    });
    recordGasUsed(tx1, 'claim - can claim multiple times with different signatures - 1');

    const encoded2 = abi.soliditySHA3(
      ['address', 'uint256', 'uint256'],
      [clientAddress, balance, 2]
    );
    const { v: v2, r: r2, s: s2 } = ethUtil.ecsign(encoded2, privateKey);
    const hash2 = ethUtil.toRpcSig(v2, r2, s2);
    const tx2 = await this.contract.claim(clientAddress, balance, 2, hash2, {
      from: otherAddress,
    });
    recordGasUsed(tx2, 'claim - can claim multiple times with different signatures - 2');

    const newBalance = await web3.eth.getBalance(clientAddress);
    (Number(newBalance) - Number(balanceBefore)).should.be
      .greaterThan(Number(balance))
      .and.lessThanOrEqual(Number(balance) * 2);
  });

  it("doesn't transfer tokens if the signature is invalid", async function () {
    const encoded = abi.soliditySHA3(
      ['address', 'uint256', 'uint256'],
      [clientAddress, balance, nonce - 17]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    await truffleAssert.reverts(
      this.contract.claim(clientAddress, balance, nonce, hash),
      'Claim: Invalid signature'
    );
  });

  it("doesn't transfer tokens if already claimed", async function () {
    const encoded = abi.soliditySHA3(
      ['address', 'uint256', 'uint256'],
      [clientAddress, balance, nonce]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    const tx = await this.contract.claim(clientAddress, balance, nonce, hash);
    recordGasUsed(tx, "claim - doesn't transfer tokens if already claimed");
    await truffleAssert.reverts(
      this.contract.claim(clientAddress, balance, nonce, hash),
      'Claim: Already claimed'
    );
  });

  it('is able to check claimed amount', async function () {
    const initialBalance = await this.contract.getClaimedAmount(clientAddress, balance, nonce);
    initialBalance.toNumber().should.be.equal(0, 'The initial balance should be 0');

    const encoded = abi.soliditySHA3(
      ['address', 'uint256', 'uint256'],
      [clientAddress, balance, nonce]
    );

    const { v, r, s } = ethUtil.ecsign(encoded, privateKey);
    const hash = ethUtil.toRpcSig(v, r, s);

    await this.contract.claim(clientAddress, balance, nonce, hash);

    const newBalance = await this.contract.getClaimedAmount(clientAddress, balance, nonce);
    Number(newBalance).should.be.equal(Number(balance), 'The balance should be ' + Number(balance));
  });
});
