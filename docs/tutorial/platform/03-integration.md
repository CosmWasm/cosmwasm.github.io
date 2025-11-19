---
title: Integration into Cosmos
description: Add the CosmWasm module to your app-chain
---

# Integration into Cosmos

You have decided to add CosmWasm to your app-chain, now what?
You need to add the CosmWasm module to the code of your Cosmos SDK app-chain, and integrate it as tightly as desirable.
The document source for this process can be found [here](https://github.com/CosmWasm/wasmd/blob/main/INTEGRATION.md),
where you can also find more detailed steps and corner cases.

The Cosmos SDK is highly customizable. Not only can you add your own modules, you can also replace stock modules with your modified ones.
Because of this customizability, the amount of work required to integrate CosmWasm into your app-chain will vary.

This section is not about experimenting with CosmWasm (see [here](./04-hello-world.md) for that)
or learning how to write CosmWasm smart contracts (see [here](./05-first-contract.md) for that).

## Prerequisites

CosmWasm supports different Cosmos SDK versions, but you nonetheless have a limited choice of CosmWasm versions per Cosmos SDK versions.
See the list [here](https://github.com/CosmWasm/wasmd/blob/main/INTEGRATION.md#prerequisites).

Additionally, because of current limitations coming from `wasmvm`, only nodes running Linux or Mac on Intel CPUs
are supported for production, although Mac on ARM CPUs are supported for testing.

## If you have a stock app-chain

If you have the standard modules, the standard Proof-of-Stake, the standard Merkle tree storage,
have not modified any modules, then these would be your steps. If this does not describe your case,
this part can still inform you about the steps you will need to complete before moving on to the customized parts.

1. You [declare the `wasmd` dependency](https://github.com/osmosis-labs/osmosis/blob/v9.0.0-rc0/go.mod#L6) just like any other.
2. You [import the `x/wasm` module](https://github.com/osmosis-labs/osmosis/blob/v9.0.0-rc0/app/app.go#L11), and wire it up in `app.go`.
3. You add the [two necessary ante handlers](https://github.com/osmosis-labs/osmosis/blob/v9.0.0-rc0/app/ante.go#L42-L43).

The [`wasmd`](https://github.com/CosmWasm/wasmd/tree/main) repository itself is an example of an integration into Gaia,
the code behind the Cosmos Hub. Except that it has the `x/wasm` as code instead of a dependency.
You might choose to copy the `x/wasm` folder too, but this would cost you a lot when updating.

## If you have modified stock modules

This really is case by case. For instance:

- You may have changed the underlying Merkle tree structure for storage.
  In this case, you need to [remove the `"iterator"`](https://github.com/osmosis-labs/osmosis/blob/v25.2.0/app/keepers/keepers.go#L563)
  capability from the integration.
- You may have swapped Proof-of-Stake with a Proof-of-Authority.
  In this case, you need to [remove the `"staking"`](https://github.com/osmosis-labs/osmosis/blob/v25.2.0/app/keepers/keepers.go#L563)
  capability.

## If you have custom Cosmos SDK modules

In this case, it makes sense to make it easy for smart contract developers to access your custom modules
with the use of your custom messages. What you create for this purpose are called _bindings_.

The standard CosmWasm library offers `CosmosMsg::Custom` and `QueryRequest::Custom` objects for you to extend
and define access to SDK modules. So first, on the Rust end,
you expose [the available messages](https://github.com/osmosis-labs/bindings/blob/main/packages/bindings/src/msg.rs).

Then, on the app-chain end, typically in a separate module that you would call `wasmbindings`,
you create a [`CustomQuerier`](https://github.com/osmosis-labs/osmosis/blob/v25.2.0/wasmbinding/query_plugin.go)
and [`CustomMessenger`](https://github.com/osmosis-labs/osmosis/blob/v25.2.0/wasmbinding/message_plugin.go) that bind
your custom messages and queries to their actual actions in your module.
Then you pass these with [the CosmWasm options](https://github.com/osmosis-labs/osmosis/blob/v25.2.0/wasmbinding/wasm.go),
to be used at the [`app` wiring](https://github.com/osmosis-labs/osmosis/blob/188abfcd15544ca07d468c0dc0169876ffde6079/app/keepers/keepers.go#L576).

At this point, it is possible for any smart contract to call into your custom modules.
In fact, you ought to let smart contracts confirm that they can by telling the CosmWasm module
to expose a `requires_MY_MODULE` command,
[`"osmosis"` in this example](https://github.com/osmosis-labs/osmosis/blob/188abfcd15544ca07d468c0dc0169876ffde6079/app/keepers/keepers.go#L574).
This command can be checked at smart contract instantiation to avoid smart contracts with effectively un-runnable code.

Additionally, to improve the smart contract developers' experience, you ought to create valid mocks of query replies
so that developers can run accurate tests.
