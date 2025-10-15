---
slug: /
title: Welcome
sidebar_position: 1
---

![CosmWasm](/img/cosmwasm.svg)

# Welcome to CosmWasm 

The [x/wasm] module, the root of CosmWasm, is a [Cosmos SDK] module enabling smart contracts
to execute on the CosmWasm virtual machine. CosmWasm itself refers to the whole ecosystem
built around it with a mission to make smart contract development easy and reliable.
The focus of the CosmWasm platform are security, performance, and interoperability.
It is tailored for a tight integration with Cosmos SDK and to build IBC contracts.

We chose to target a Rust programming language as a smart contract development stack, as it is
popular amongst blockchain developers and has the best Wasm compiler on the market so far. We do not
provide bindings to help write smart contracts in another stack that compiles to Wasm, and we don't
support that.

Here is where to find CosmWasm in the whole Cosmos stack:

```mermaid
graph TD
    A["Cosmos SDK"]:::cosmos -->|"_uses_"| B[CometBFT]
    A -->|"_includes_"| C["CosmWasm"]
    A -->|"_includes_"| D["Custom Module"]
    C -->|"_executes_"| E["Smart Contract"]

    classDef cosmos fill:#e0f7fa,stroke:#00796b,stroke-width:2px;
    classDef wasm fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px;
    classDef custom fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    classDef contract fill:#fbe9e7,stroke:#d84315,stroke-width:2px;

    class A cosmos;
    class B cosmos;
    class C wasm;
    class D cosmos;
    class E wasm;
```

The important thing about CosmWasm smart contracts is their transparency. Every smart contract
instance has its unique address on the chain, and it can act just like any other account on chain.
It is easy to implement communication between two smart contracts on the same chain. CosmWasm
standard library provides simple utilities to communicate with non-CosmWasm modules on the chain.
That includes common Cosmos modules like bank or staking and any custom module unique for a
particular chain. Finally, CosmWasm is built around the [IBC] and provides a simple API
to communicate with other chains and contracts using IBC-based protocols.

This documentation already covers most of the stack. Still, some parts are a work in progress.
If there is something you remember being here in the old documentation, you can find its content
at https://github.com/CosmWasm/docs-deprecated. Remember that the old documentation is deprecated,
mostly outdated, and will not be maintained. We would appreciate any GitHub issues about missing
parts in the [documentation repository].

[x/wasm]: https://github.com/CosmWasm/wasmd/tree/main/x/wasm
[Cosmos SDK]: https://docs.cosmos.network/
[IBC]: https://www.ibcprotocol.dev/
[documentation repository]: https://github.com/CosmWasm/cosmwasm.github.io
