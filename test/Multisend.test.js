const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const Multisend = artifacts.require('./Multisend.sol'),
  Tara = artifacts.require('./Tara.sol'),
  BigNumber = web3.BigNumber,
  { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

require('chai').use(require('chai-as-promised')).use(require('chai-bignumber')(BigNumber)).should();

contract('Multisend', () => {
  beforeEach(async function () {
    this.token = await Tara.new(1000000000);
    this.contract = await Multisend.new();
  });

  it('transfers tokens if inputs are valid', async function () {
    let recipients = [];
    let amounts = [];
    for (let i = 0; i < 10; i++) {
      const account = web3.eth.accounts.create();
      recipients.push(account.address);
      amounts.push(123 + i);
    }

    const total = amounts.reduce((a, b) => {
      return a + b;
    }, 0);

    await this.token.approve(this.contract.address, total.toString());
    const tx = await this.contract.multisendToken(this.token.address, recipients, amounts);

    for (let i = 0; i < 10; i++) {
      const recipient = recipients[i];
      const balance = await this.token.balanceOf(recipient);
      balance
        .toString()
        .should.be.bignumber.equal(
          web3.utils.toBN(`${123 + i}`).toString(),
          `Wrong recipient balace - : ${web3.utils.toBN(`${123 + i}`).toString()}`
        );
    }

    const event = tx.logs.find((log) => log.event === 'TokensSent');
    assert.exists(event, 'TokensSent event not found');
    event.args.total.toString().should.equal(total.toString(), 'Total value mismatch');
    event.args.tokenAddress.should.equal(this.token.address, 'Token address mismatch');
  });

  it('throws if number of recipients exceeds max number of txs', async function () {
    let recipients = [];
    let amounts = [];
    for (let i = 0; i < 210; i++) {
      const account = web3.eth.accounts.create();
      recipients.push(account.address);
      amounts.push('0');
    }

    await expectRevert(
      this.contract.multisendToken(this.token.address, recipients, amounts),
      'Multisend: max transfers per tx exceeded'
    );
  });

  it('throws if number of recipients is not the same as the number of amounts', async function () {
    let recipients = [];
    let amounts = [];

    for (let i = 0; i < 10; i++) {
      const account = web3.eth.accounts.create();
      recipients.push(account.address);
      amounts.push('0');
    }

    amounts.pop();

    await expectRevert(
      this.contract.multisendToken(this.token.address, recipients, amounts),
      'VM Exception while processing transaction: revert Multisend: contributors and balances have different sizes'
    );
  });
});
