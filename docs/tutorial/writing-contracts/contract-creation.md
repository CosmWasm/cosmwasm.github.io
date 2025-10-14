---
sidebar_position: 1
---

# Contract creation

The easiest and recommended way to start working on a new CosmWasm contract is to generate it from
the [`cw-template`](https://github.com/CosmWasm/cw-template).

```shell title="terminal"
cargo generate CosmWasm/cw-template
```

The [`cw-template`](https://github.com/CosmWasm/cw-template) will generate a lot of code for you.
Because this tutorial aims to guide you step-by-step through the process of creating your first
contract, for now, we will omit the use of the template and show you how to create it from the start.

## New project

As smart contracts are Rust library crates, we will start with creating one:

```shell title="terminal"
cargo new --lib ./contract
```

You created a simple Rust library, but it is not yet ready to be a smart contract.
The first thing to do is to update the **Cargo.toml** file:

```toml title="Cargo.toml"
[package]
name = "contract"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
cosmwasm-std = { version = "3", features = ["staking"] }
```

As you can see, we have added a `crate-type` field in the library section. Generating the `cdylib` is
required to create a proper web assembly binary. The downside of this is that such a library cannot
be used as a dependency for other Rust crates. For now, it is not needed, but later we will show
how to approach reusing contracts as dependencies.

Additionally, there is one core dependency for smart contracts: the
[`cosmwasm-std`](https://docs.rs/cosmwasm-std/latest/cosmwasm_std/). This crate is a standard
library for smart contracts. It provides essential utilities for communication with the outside
world and a couple of helper functions and types. Every smart contract we will build will use this
dependency.
