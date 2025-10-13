---
sidebar_position: 2
---

# Entrypoints

Typical Rust application starts with the **`fn main()`** function executed by the operating system.
Smart contracts are not significantly different. When the message is sent to the contract, a function
called _**entrypoint**_ is executed. Unlike native applications, which have only a single `main` _entrypoint_,
smart contracts have a couple of them, corresponding to different message types:

`instantiate`, `execute`, `query`, `sudo`, `migrate` and more.

To start, we will go with three basic entrypoints:

- `instantiate` - which is called once per smart contract lifetime;
   you can think about it as a constructor or initializer of a contract,
- `execute` - for handling messages which are able to modify contract state;
   they are used to perform some actual actions.
- `query` for handling messages requesting some information from a contract;
   unlike execute, they can never affect any contract state, and are used just like database queries.

We will start with the instantiate entrypoint:

```rust title="src/lib.rs"
use cosmwasm_std::{entry_point, DepsMut, Empty, Env, MessageInfo, Response, StdResult};

#[entry_point]
pub fn instantiate(deps: DepsMut, env: Env, info: MessageInfo, msg: Empty) -> StdResult<Response> {
    Ok(Response::new())
}
```

In fact, `instantiate` is the only entrypoint required for a smart contract to be valid.
It is not very useful in this form, but it is a start. Let's take a closer look at the entrypoint structure.

First, we start with importing a couple of types just for more consistent usage.
Then we define our entrypoint. The `instantiate` takes four arguments:

- [`deps: DepsMut`](https://docs.rs/cosmwasm-std/latest/cosmwasm_std/struct.DepsMut.html) - is a
  utility type for communicating with the outer world - it allows querying and updating the contract
  state, querying other contracts state, and gives access to an `Api` object with a couple of helper
  functions for dealing with CW addresses.
- [`env: Env`](https://docs.rs/cosmwasm-std/latest/cosmwasm_std/struct.Env.html) - is an object
  representing the blockchains state when executing the message - the chain height and id, current
  timestamp, and the called contract address.
- [`info: MessageInfo`](https://docs.rs/cosmwasm-std/latest/cosmwasm_std/struct.MessageInfo.html) -
  contains metainformation about the message that triggered the execution - an address that sends
  the message, and chain native tokens sent with the message.
- [`msg: Empty`](https://docs.rs/cosmwasm-std/latest/cosmwasm_std/struct.Empty.html) - is the message
  triggering execution itself - for now, it is the `Empty` type that represents `{}` JSON, but the
  type of this argument can be anything that is deserializable, and we will pass more complex types
  here in the future.

If you are new to the blockchain, those arguments may not make much sense to you, but as you work
through this guide, we will explain their usage one by one.

Please notice an essential attribute decorating our entrypoint
[`#[entry_point]`](https://docs.rs/cosmwasm-std/latest/cosmwasm_std/attr.entry_point.html). Its
purpose is to wrap the whole entrypoint to the form Wasm runtime understands. proper Wasm entrypoints
can use only basic types supported natively by Wasm specification, and Rust structures and
enums are not in this set. Working with such entrypoints would be rather overcomplicated, so
CosmWasm creators delivered the `entry_point` macro. It creates the raw Wasm entrypoint, calling the
decorated function internally and doing all the magic required to build our high-level Rust
arguments from arguments passed by Wasm runtime.

The next thing to look at is the return type. We have used
[`StdResult<Response>`](https://docs.rs/cosmwasm-std/latest/cosmwasm_std/type.StdResult.html) for
this simple example, which is an alias for `Result<Response, StdError>`. The return entrypoint type
would always be a [`Result`](https://doc.rust-lang.org/std/result/enum.Result.html) type, with some
error type implementing [`ToString`](https://doc.rust-lang.org/std/string/trait.ToString.html) trait
and a well-defined type for the success case. For most entrypoints, an "Ok" case would be the
[`Response`](https://docs.rs/cosmwasm-std/latest/cosmwasm_std/struct.Response.html) type that allows
fitting the contract into our actor model, which we will discuss very soon.

The body of the entrypoint is as simple as it could be, it always succeeds with a trivial empty response.
