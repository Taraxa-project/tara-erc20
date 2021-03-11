# Taraxa Contracts

This repository contains two contracts:

- TARA ERC20 Contract
- Taraxa Claim Contract

## TARA ERC20 Contract

The TARA ERC20 token is a temporary token on the Ethereum network.

When the Taraxa mainnet goes live, this ERC20 contract will be paused and the balances will be transferred to the Taraxa chain.

### Contract Details

- Name: Taraxa Coin
- Symbol: TARA
- Decimals: 18

The ERC20 contract uses the OpenZeppelin [ERC20PresetMinterPauser](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v3.4-solc-0.7/contracts/presets/ERC20PresetMinterPauser.sol) contract.

OpenZeppelin contracts are community audited and considered to be safe.

## Taraxa Claim Contract

The Claim Contract is used to distribute tokens from public sales and bounties. Participants will be able to iteract with this contract via the [Taraxa Claim](https://claim.taraxa.io/) app.

### Contract Details

The signature contains the address of the participant, the number of tokens and a nonce. The contract uses `ecrecover` to verify that the signature was created by our trusted account.

If the signature is valid, the contract will transfer the tokens from a Taraxa owned wallet to the participant.

### Running the tests

Install the dependencies:

```bash
yarn install
```

Create the .env file:

```bash
cp -v .env.example .env
```

Run the ganache-cli test rpc with a predefined mnemonic phrase:

```bash
yarn testrpc
```

Run the tests in a new terminal session:

```bash
truffle test
```