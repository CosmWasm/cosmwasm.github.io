---
title: Introduction
description: Introduction to CosmWasm
---

# Introduction

## From smart contracts to CosmWasm

A smart contract is a piece of code that runs automatically in a provable way. The joke is that it is neither smart, as it only does what it is instructed to do, nor a contract, as it is not legally binding.

This originally-abstract concept was made real with the advent of blockchains, and in particular of Ethereum.

On a typical Ethereum platform, anyone is free to deploy a smart contract as long as they have the tokens to do so, and no validators are censoring them. A set of smart contracts plus related off-chain elements has come to be called a decentralized application, or dApp. However, a platform open to all introduces trade-offs, such as congestion that has nothing to do with the success of your application. This is why other platforms introduced the concept of application-specific blockchains, or app-chains for short, most notably the **Interchain**, a constellation of app-chains, most of them built off of the **Cosmos SDK**.

The code that makes a given app-chain, or at least the part that impacts network consensus, can still be considered a smart contract, or a set thereof, as it runs automatically in a provable way. The difference is that to change a piece of code on an app-chain, or to add a new one, you need to make an on-chain proposal and reach consensus over it. This hurdle is in fact one of the points of an app-chain.

Inevitably, this free-for-all / strict-app-chain dichotomy is not perfect, and some app-chains have had a need to reintroduce free (as in free speech, not free beer) smart contracts, for instance to **foster experimentation**. For this to be possible, an app-chain needs to have **components** that impact the network consensus, and that allow the deployment of **Turing-complete smart contracts**. Or at least complete within the limited resources of a blockchain. If these specific components are not present at the genesis of the app-chain, they too need to be introduced like any other with an on-chain proposal. After the relevant proposal has passed, then it becomes possible to deploy _free_ smart contracts.

:::info

This is where **CosmWasm** comes in, as the set of components that allow the deployment of Turing-complete smart contracts.

:::

The **Cosm** part of its name refers to the [Cosmos SDK](https://docs.cosmos.network). So unsurprisingly, the [CosmWasm _module_](https://github.com/CosmWasm/wasmd/tree/main/x/wasm) is a Cosmos SDK module, which may be present at genesis, or may be introduced as part of an upgrade proposal. This module allows any developer, at a minimum, to deploy smart contracts within it, and, more importantly, to have them **interact** with the rest of the app-chain in a controlled and controllable way.

## CosmWasm tool chain

Now that you understand the big picture of what CosmWasm is from the point of view of an app-chain, let's look at it from the point of view of a smart contract developer. To be able to work, as a smart contract developer you need to understand:

* What languages are available.
* What are the interfaces and communication protocols you have to use and follow.
* What resources are available to the deployed smart contract, in this case, app-chain resources.
* What are the tools that will assist you or improve your productivity.

The smart contract language chosen for CosmWasm is [WebAssembly](https://webassembly.org/), which explains the **Wasm** part of its name. WebAssembly is a stack-based binary instruction format associated with a set of low-level instructions. There exist WebAssembly virtual machines (WAVM) that are able to execute this binary, including in Web browsers. If you come from the Java or the Ethereum worlds, these concepts map directly to the JVM/EVM, bytecodes, and Assembly languages.

:::info

As such, the CosmWasm module, runs, connects, and instruments a WebAssembly VM variant, also known as _runtime_, currently [Wasmer](https://github.com/CosmWasm/cosmwasm/blob/main/packages/vm/Cargo.toml#L59). It also instruments it in order to, for instance, meter operations with a gas mechanism as a denial-of-service countermeasure.

:::

And just as in the Ethereum and Java worlds, developers code in higher-level languages, such as Solidity or Java, which are then compiled to their respective bytecodes. For CosmWasm, the currently preferred higher-level language is [**Rust**](https://www.rust-lang.org/).

Rust exists and grows independently of the blockchain world, therefore the larger ecosystem can benefit CosmWasm developers, with important exceptions such as non-deterministic functions. This is why, within CosmWasm's set of components, you can find:

* A set of interfaces that help you code your smart contracts as per the expectations of the CosmWasm module.
* An extensible set of messages defined in Rust that, when serialized and then interpreted by the CosmWasm module, allow your smart contract to communicate with the app-chain's other modules.
* Further libraries to handle storage, testing, and more.
* A compilation target, bytecode optimizer and checker to account for blockchains' particular situation, especially their limited resources.

In addition, given that it is built for the Interchain, CosmWasm is ready for [IBC](https://www.ibcprotocol.dev), the Inter-Blockchain Protocol. Your CosmWasm smart contracts can even exchange messages with other CosmWasm smart contracts, or its own clones, on other app-chains.
