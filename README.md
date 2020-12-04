# TARA ERC20 Contract

The TARA ERC20 token is a temporary token on the Ethereum network that will be used to track distribution of real TARA tokens on the Taraxa network in the genesis block.

When the Taraxa mainnet goes live based on this genesis block, the ERC20 contract will be paused, and TARA ERC20 token will no longer be useable.

### Contract Details

The ERC20 contract is the Open Zeppelin [ERC20PresetMinterPauser](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/presets/ERC20PresetMinterPauser.sol) with an additional multiTransfer() function based on on Bloq's [MultiTransfer](https://github.com/bloq/sol-mass-payouts/blob/v0.2.0/contracts/MultiTransfer.sol) contract.

- Name: Taraxa Coin
- symbol: TARA
- decimals: 18