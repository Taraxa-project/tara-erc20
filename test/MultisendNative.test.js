const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const Multisend = artifacts.require('./MultisendNative.sol'),
  BigNumber = web3.BigNumber,
  { expectRevert } = require('@openzeppelin/test-helpers');

require('chai').use(require('chai-as-promised')).use(require('chai-bignumber')(BigNumber)).should();

contract('Multisend', (accounts) => {
  beforeEach(async function () {
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

    const tx = await this.contract.multisendToken(recipients, amounts, {
      from: accounts[0],
      value: total,
    });

    for (let i = 0; i < 10; i++) {
      const recipient = recipients[i];
      const balance = await web3.eth.getBalance(recipient);
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
    event.args.lastSentIndex.toString().should.equal('10', 'Total value mismatch');
  });

  it('throws if value doesnt cover first tx', async function () {
    let recipients = [];
    let amounts = [];
    for (let i = 0; i < 10; i++) {
      const account = web3.eth.accounts.create();
      recipients.push(account.address);
      amounts.push(123 + i);
    }

    await expectRevert(
      this.contract.multisendToken(recipients, amounts, {
        from: accounts[1],
        value: 0,
      }),
      "VM Exception while processing transaction: revert Multisend: Sent value doesn't cover first transaction"
    );
  });

  it('throws if number of recipients exceeds max number of txs', async function () {
    let recipients = [];
    let amounts = [];
    for (let i = 0; i < 210; i++) {
      const account = web3.eth.accounts.create();
      recipients.push(account.address);
      amounts.push('0');
    }

    const total = amounts.reduce((a, b) => {
      return a + b;
    }, 0);

    await expectRevert(
      this.contract.multisendToken(recipients, amounts, {
        from: accounts[1],
        value: total,
      }),
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

    const total = amounts.reduce((a, b) => {
      return a + b;
    }, 0);

    await expectRevert(
      this.contract.multisendToken(recipients, amounts, {
        from: accounts[2],
        value: total,
      }),
      'VM Exception while processing transaction: revert Multisend: contributors and balances have different sizes'
    );
  });

  it('transfers tokens if inputs are valid until value runs out', async function () {
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

    const totalWithoutLast = total - amounts[amounts.length - 1];
    const tx = await this.contract.multisendToken(recipients, amounts, {
      from: accounts[3],
      value: totalWithoutLast,
    });

    for (let i = 0; i < 9; i++) {
      const recipient = recipients[i];
      const balance = await web3.eth.getBalance(recipient);
      balance
        .toString()
        .should.be.bignumber.equal(
          web3.utils.toBN(`${123 + i}`).toString(),
          `Wrong recipient balace - : ${web3.utils.toBN(`${123 + i}`).toString()}`
        );
    }

    const event = tx.logs.find((log) => log.event === 'TokensSent');
    assert.exists(event, 'TokensSent event not found');
    event.args.total.toString().should.equal(totalWithoutLast.toString(), 'Total value mismatch');
    event.args.lastSentIndex.toString().should.equal('9', 'Total value mismatch');
  });

  it('transfers tokens if inputs are valid until value runs out - then sends back remaining balance', async function () {
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

    const totalWithoutLastPlusSome =
      total - amounts[amounts.length - 1] + amounts[amounts.length - 1] / 2;
    const totalWithoutLast = total - amounts[amounts.length - 1];
    const difference = totalWithoutLastPlusSome - totalWithoutLast;
    const tx = await this.contract.multisendToken(recipients, amounts, {
      from: accounts[3],
      value: totalWithoutLastPlusSome,
    });

    for (let i = 0; i < 9; i++) {
      const recipient = recipients[i];
      const balance = await web3.eth.getBalance(recipient);
      balance
        .toString()
        .should.be.bignumber.equal(
          web3.utils.toBN(`${123 + i}`).toString(),
          `Wrong recipient balace - : ${web3.utils.toBN(`${123 + i}`).toString()}`
        );
    }

    const event = tx.logs.find((log) => log.event === 'TokensSent');
    assert.exists(event, 'TokensSent event not found');
    event.args.total.toString().should.equal(totalWithoutLast.toString(), 'Total value mismatch');
    event.args.lastSentIndex.toString().should.equal('9', 'Total value mismatch');

    const eventSentBack = tx.logs.find((log) => log.event === 'SentBack');
    assert.exists(eventSentBack, 'SentBack event not found');
    eventSentBack.args.amount
      .toString()
      .should.equal(difference.toString(), 'Sent back value mismatch');
  });
});
