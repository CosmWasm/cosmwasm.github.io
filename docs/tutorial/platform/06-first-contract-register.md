---
title: First Execute Transaction
description: Add a function to your smart contract so you can register a name to an address via a transaction.
---

# First Execute Message

In the previous section you created a barebones smart contract. It exists but does not do much. In this section, you are going to have it do something: your smart contract is going to handle a transaction message.

<HighlightBox type="info" title="Exercise progression">

If you skipped the previous section, you can just switch the project to its [`first-unit-test`](https://github.com/b9lab/cw-my-nameservice/tree/first-unit-test) branch and take it from there.

</HighlightBox>

## The execute message

First off, you have to decide what message it is going to execute. You are implementing a nameservice, so it is reasonable to pick a message that will **register a name**.

Add the following code in `src/msg.rs`:

<CodeBlock title="src/msg.rs">
    ```diff-rs
      use cosmwasm_schema::cw_serde;

      #[cw_serde]
      pub struct InstantiateMsg {}

    + #[cw_serde]
    + pub enum ExecuteMsg {
    +     Register { name: String },
    + }
    ```
</CodeBlock>

Note that:

* Your transaction message, and all future variants, will fall under `enum ExecuteMsg`.
* It too is serialized using `cw_serde`.
* Your first variant is `Register`.
* This variant only carries a `name: String`. Implicit here is that the sender's address is the other important parameter.

## The storage definition

Because your smart contract is meant to store the incoming information for future reference, you are about to keep in storage what the names map to. To help you define storage elements, you ought to use a library created to that effect. There are currently two of them, [StoragePlus](https://docs.cosmwasm.com/cw-storage-plus) and [Storey](https://docs.cosmwasm.com/storey). Here you add a new dependency for the CosmWasm StoragePlus elements.

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        cargo add cw-storage-plus2.0.0
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        ```sh
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add cw-storage-plus@2.0.0
        ```
    </TabGroupItem>
</TabGroup>

Then you need to describe the layout of the storage. Create the file `src/state.rs` with:

<CodeBlock title="src/state.rs">
    ```rust
    use cosmwasm_schema::cw_serde;
    use cosmwasm_std::Addr;
    use cw_storage_plus::Map;

    #[cw_serde]
    pub struct NameRecord {
        pub owner: Addr,
    }

    pub const NAME_RESOLVER: Map<&[u8], NameRecord> = Map::new("name_resolver");
    ```
</CodeBlock>

Note how:

* You declare a new [`Map`](https://docs.cosmwasm.com/cw-storage-plus/containers/map), a type defined in `cw_storage_plus`.
* This map uses the [namespace](https://docs.cosmwasm.com/cw-storage-plus/basics#keys-and-prefixes) `"name_resolver"`, which will be used as a [prefix](https://github.com/CosmWasm/cw-storage-plus/blob/v2.0.0/src/map.rs#L64) for all the item keys in it.
* You will use the variable named `NAME_RESOLVER` to access items in the map.
* Keys are declared as pure bytes, `[u8]`, for more versatility.
* A `NameRecord` is the type of values that will be in this map.
* Values are stored as [serialized JSON](https://github.com/CosmWasm/cw-storage-plus/blob/v2.0.0/src/item.rs#L53), so you need to flag that as well with `cw_serde` on `NameRecord`.

Don't forget to make the state locally accessible to your project: add the following line to `src/lib.rs`.

<CodeBlock title="src/lib.rs">
    ```diff-rs
      pub mod contract;
      mod error;
      pub mod msg;
    + mod state;
    ```
</CodeBlock>

## A new error

Before moving on to the execution code, you can foresee that you will forbid registering a name that is already taken. Add an error for this situation: the value `NameTaken` to the enum `ContractError` in `src/error.rs`:

<CodeBlock title="src/error.rs">
    ```diff-rs
      #[derive(Error, Debug)]
      pub enum ContractError {
          #[error("{0}")]
          Std(#[from] StdError),
    +     #[error("Name already taken ({name})")]
    +     NameTaken { name: String },
      }
    ```
</CodeBlock>

Note that it accepts the `name` as a string in order to provide better error formatting.

## The execute function

You add the handling in `src/contract.rs`. Adjust the imports:

<CodeBlock title="src/contract.rs">
    ```diff-rs
    - use crate::{error::ContractError, msg::InstantiateMsg};
    + use crate::{
    +    error::ContractError,
    +    msg::{ExecuteMsg, InstantiateMsg},
    +    state::{NameRecord, NAME_RESOLVER},
    + };
    ```
</CodeBlock>

And add two new functions:

<CodeBlock title="src/contract.rs">
    ```rust
    #[cfg_attr(not(feature = "library"), entry_point)]
    pub fn execute(deps: DepsMut, _: Env, info: MessageInfo, msg: ExecuteMsg) -> ContractResult {
        match msg {
            ExecuteMsg::Register { name } => execute_register(deps, info, name),
        }
    }

    fn execute_register(deps: DepsMut, info: MessageInfo, name: String) -> ContractResult {
        let key = name.as_bytes();
        let record = NameRecord { owner: info.sender };

        if NAME_RESOLVER.has(deps.storage, key) {
            return Err(ContractError::NameTaken { name });
        }

        NAME_RESOLVER.save(deps.storage, key, &record)?;

        Ok(Response::default())
    }
    ```
</CodeBlock>

Note how:

* The `execute` function only cares to dispatch the messages according to their variant. This is the [conventional way](https://docs.cosmwasm.com/core/conventions/enum-dispatch) of handling execution in CosmWasm, so that the function body's size remains manageable as more message variants are added.
* The `execute_register` is where the proper implementation of `Register` is handled.
* The implementation is quite typical, you only save to storage if there are no pre-existing values.
* The sender information is found in `info: MessageInfo`.
* `NAME_RESOLVER` has functions named `has` and `save`, where the function parameter is `deps.storage`. This is the CosmWasm way, and it may look like an inversion of responsibility if you come from other platforms.

Your contract can now register names with the sender adresses while rejecting already registered names.

<HighlightBox type="tip">

If you wanted to make it possible for _someone_ to register names for someone else, you would need to add an address to the message too. In particular, if you introduced auctions on names, the sender would be the auction smart contract, and the address in the message, i.e. the owner, would be the auction winner.

</HighlightBox>

## Unit testing

With a new message and code, it is time to unit test it.

In `src/contract.rs`, add the following:

<CodeBlock title="src/contract.rs">
    ```diff-rs
    ...

      #[cfg(test)]
      mod tests {
    -     use crate::msg::InstantiateMsg;
    +     use crate::{
    +         msg::{ExecuteMsg, InstantiateMsg},
    +         state::{NameRecord, NAME_RESOLVER},
    +     };
          use cosmwasm_std::{testing, Addr, Response};

          #[test]
          fn test_instantiate() {
              ...
          }

    +     #[test]
    +     fn test_execute() {
    +         // Arrange
    +         let mut mocked_deps_mut = testing::mock_dependencies();
    +         let mocked_env = testing::mock_env();
    +         let mocked_addr = Addr::unchecked("addr");
    +         let mocked_msg_info = testing::message_info(&mocked_addr, &[]);
    +         let name = "alice".to_owned();
    +         let execute_msg = ExecuteMsg::Register { name: name.clone() };
    +         
    +         // Act
    +         let contract_result = super::execute(
    +             mocked_deps_mut.as_mut(),
    +             mocked_env,
    +             mocked_msg_info,
    +             execute_msg,
    +         );
    +         
    +         // Assert
    +         assert!(contract_result.is_ok(), "Failed to register alice");
    +         assert_eq!(contract_result.unwrap(), Response::default());
    +         assert!(NAME_RESOLVER.has(mocked_deps_mut.as_ref().storage, name.as_bytes()));
    +         let stored = NAME_RESOLVER.load(mocked_deps_mut.as_ref().storage, name.as_bytes());
    +         assert!(stored.is_ok());
    +         assert_eq!(stored.unwrap(), NameRecord { owner: mocked_addr });
    +     }
      }
    ```
</CodeBlock>

Note how:

* You can mock all the elements that go into the call.
* It tests the return values of the call.
* It tests that the expected value is found in storage.

After you run the tests, it should print:

```txt
...
running 2 tests
test contract::tests::test_instantiate ... ok
test contract::tests::test_execute ... ok
...
```

## Conclusion

<HighlightBox type="info" title="Exercise progression">

At this stage, you should have something similar to the [`first-execute-message`](https://github.com/b9lab/cw-my-nameservice/tree/first-execute-message) branch, with [this](https://github.com/b9lab/cw-my-nameservice/compare/first-unit-test..first-execute-message) as the diff.

</HighlightBox>

It is possible to store names and their addresses, but it is not possible to retrieve them, other than querying the storage natively. You fix that in the next section.

