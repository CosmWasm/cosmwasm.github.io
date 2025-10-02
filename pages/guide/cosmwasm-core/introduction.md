# Introduction

This chapter will give you an overview over CosmWasm from a contract developer perspective, its
capabilities, and guide you through initializing your first smart contract.

::: tip :bulb: Tip 
We assume you have a basic knowledge of Rust and Cargo (Rust's standard build system).
If not, have a look [here](https://www.rust-lang.org/learn/get-started).
No worries, you don't need to be a Rust expert to write your first smart contract.
:::


## What is CosmWasm?

CosmWasm is a platform for writing smart contracts for Cosmos chains using Rust and WebAssembly.
Meaning CosmWasm is your one-stop shop for developing, testing, and running smart contracts on
enabled chains.

## What does CosmWasm provide?

For you, a contract developer, CosmWasm provides a set of high-quality primitives through our
standard library. These primitives include:

- extended precision arithmetic (128-, 256- and 512-bit integers),
- cryptographic primitives (for example, secp256k1 verification),
- interaction with the Cosmos SDK,
- IBC connectivity.

## What does CosmWasm NOT provide?

- Storage abstractions (for this, check out [cw-storage-plus](https://github.com/CosmWasm/cw-storage-plus).
- Testing framework (for this, check out [cw-multi-test](https://github.com/CosmWasm/cw-multi-test).
