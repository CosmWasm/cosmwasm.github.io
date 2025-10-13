---
sidebar_position: 1
---

# Environment setup

## Rust installation

To work with CosmWasm smart contract, you will need Rust installed on your machine. If you don't
have it, you can find installation instructions on
[the Rust website](https://www.rust-lang.org/tools/install).

We assume you are working with the stable Rust channel in this book.

Additionally, you will need the Rust Wasm compiler backend installed to build Wasm binaries.
To install it, run:

```shell title="terminal"
rustup target add wasm32-unknown-unknown
```

## The cosmwasm-check utility

An additional helpful tool for building smart contracts is the **[cosmwasm-check]** utility.
It allows you to check if the wasm binary is a proper smart contract ready to upload into the blockchain.
You can install it using Cargo:

```shell title="terminal"
cargo install cosmwasm-check
```

If the installation succeeds, you should be able to execute the utility from your command line.

```shell title="terminal"
cosmwasm-check --version
```

The output should look like this:

```text
Contract checking 3.0.2
```

## Verifying the installation

To guarantee you are ready to build your smart contracts, you need to make sure you can build examples.
Check out the **[cw-plus]** repository and run the testing command in its folder:

```shell title="terminal"
git clone git@github.com:CosmWasm/cw-plus.git && cd ./cw-plus && cargo test
```

You should see that everything in the repository gets compiled and all tests pass.

The **[cw-plus]** is a great place to find example contracts - look for them in the `contracts` directory.
The repository is maintained by CosmWasm creators, so contracts in there should follow good practices.

To use the **[cosmwasm-check]** utility, first, you need to build a smart contract.
Go to some contract directory, for example, `contracts/cw1-whitelist`, and call `cargo wasm`:

```shell title="terminal"
cd contracts/cw1-whitelist && cargo wasm
```

:::tip

Due to reference types feature enabled by default in the Rust compiler since version `1.82` it is
required to use the previous Rust compiler releases until the CosmWasm `2.2` version is released.
The CosmWasm `2.2` will enable support for the reference types.

:::

You should be able to find your output binary in the `target/wasm32-unknown-unknown/release/` of the
**root directory** of the repository (not in the contract directory itself).
Now you can check if contract validation passes:

```shell title="terminal"
cw-plus/contracts/cw1-whitelist $ cosmwasm-check ../../target/wasm32-unknown-unknown/release/
../../target/wasm32-unknown-unknown/release/cw1_whitelist.wasm Available capabilities: {"iterator",
"cosmwasm_1_1", "cosmwasm_1_2", "stargate", "staking"}

../../target/wasm32-unknown-unknown/release/cw1_whitelist.wasm: pass

All contracts (1) passed checks!
```

## Macro expansion

In VSCode you can hover over a macro like `#[cw_serde]`, do `shift+p` and then type:
`rust analyzer: Expand macro recursively`. This will open a window with a fully expanded macro,
which you can browse. In Vim, you can consider installing the [rustaceanvim] plugin.
You can also use `cargo expand` tool from CLI, like this:

```shell title="terminal"
cargo expand --lib
```

[cosmwasm-check]: https://github.com/CosmWasm/cosmwasm/tree/main/packages/check
[cw-plus]: https://github.com/CosmWasm/cw-plus
[rustaceanvim]: https://github.com/mrcjkb/rustaceanvim
