---
title: First contract query
description: Add a function to your smart contract so you can query addresses by name.
---

# First contract Query

In the previous section, you added a message to register an address under a name in storage.
In this section, you make it possible to easily query for said stored values.

:::info Exercise progression

If you skipped the previous section, you can just switch the project to its
[`first-execute-message`](https://github.com/b9lab/cw-my-nameservice/tree/first-execute-message)
branch and take it from there.

:::

## The query message and response

To query from storage, you add a specific query message and its corresponding response. Add a `QueryResponse` import to `src/msg.rs`:

```rust title="src/msg.rs"
//diff-del
- use cosmwasm_schema::cw_serde;
//diff-add
+ use cosmwasm_schema::{cw_serde, QueryResponses};
```

Then add the new enum and struct:

```rust title="src/msg.rs"
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(ResolveRecordResponse)]
    ResolveRecord { name: String },
}

#[cw_serde]
pub struct ResolveRecordResponse {
    pub address: Option<String>,
}
```

Note how:

- As with the transaction message, the `QueryMsg` is an enum.
- The `ResolveRecord` type mentions the type it returns with the use of the `returns` macro.
- `QueryResponses` is a [macro](https://github.com/CosmWasm/cosmwasm/blob/main/packages/schema-derive/src/lib.rs#L12).
- `ResolveRecordResponse` contains an `Option<String>` to account for the fact that a missing owner is a valid result when resolving a name.
- `ResolveRecordResponse` otherwise looks very much like a `NameRecord`, but it could be different and collect
  different values from different places, depending on what is needed with this query.

## The query function

You define the message handling in `src/contract.rs`. Adjust the imports:


```rust title="src/contract.rs"
  use crate::{
      error::ContractError,
//diff-del      
-     msg::{ExecuteMsg, InstantiateMsg},
//diff-add
+     msg::{ExecuteMsg, InstantiateMsg, QueryMsg, ResolveRecordResponse},
      state::{NameRecord, NAME_RESOLVER},
  };
//diff-del
- use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response};
//diff-add-start
+ use cosmwasm_std::{
+     entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
+ };
//diff-add-end
```

Then, below the `execute` function, you add the query functions:

```rust title="src/contract.rs"
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::ResolveRecord { name } => query_resolve_record(deps, name),
    }
}

fn query_resolve_record(deps: Deps, name: String) -> StdResult<Binary> {
    let key = name.as_bytes();

    let address = NAME_RESOLVER
        .may_load(deps.storage, key)?
        .map(|record| record.owner.to_string());

    let resp = ResolveRecordResponse { address };

    to_json_binary(&resp)
}
```

Note how:

- Just as for the `execute` function, the `query` function is only here to dispatch to other functions
  depending on the message variant.
- Unlike the `execute` function, it takes a non-mutable `Deps`. Indeed, a query is not meant to modify storage,
  and Rust can catch such errors at compilation instead of run time.
- The function uses the `.may_load` method to handle potential errors gracefully. See Rust's `?` conditional `return`.
- The `address` variable is an `Option<String>` because a missing value in storage is a valid response.
- The return type is JSON binary, that you create by calling the standard `serde` function `to_json_binary`.

With this done, you can now query registered addresses by their names.

## Unit testing

It's time for your third unit test. In `src/contract.rs`, add the following:

```rust title="src/contract.rs"
...

  #[cfg(test)]
  mod tests {
      use crate::{
//diff-del
-         msg::{ExecuteMsg, InstantiateMsg},
//diff-add
+         msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
          state::{NameRecord, NAME_RESOLVER},
      };
//diff-del      
-     use cosmwasm_std::{testing, Addr, Response};
//diff-add
+     use cosmwasm_std::{testing, Addr, Binary, Response};

...

      #[test]
      fn test_execute() {
          ...
      }

//diff-add-start
+     #[test]
+     fn test_query() {
+         // Arrange
+         let mut mocked_deps_mut = testing::mock_dependencies();
+         let mocked_env = testing::mock_env();
+         let name = "alice".to_owned();
+         let mocked_addr_value = "addr".to_owned();
+         let mocked_addr = Addr::unchecked(mocked_addr_value.clone());
+         let mocked_msg_info = testing::message_info(&mocked_addr, &[]);
+         let _ = super::execute_register(mocked_deps_mut.as_mut(), mocked_msg_info, name.clone())
+             .expect("Failed to register alice");
+         let query_msg = QueryMsg::ResolveRecord { name };
+     
+         // Act
+         let query_result = super::query(mocked_deps_mut.as_ref(), mocked_env, query_msg);
+     
+         // Assert
+         assert!(query_result.is_ok(), "Failed to query alice name");
+         let expected_response = format!(r#"{{"address":"{mocked_addr_value}"}}"#);
+         let expected = Binary::new(expected_response.as_bytes().to_vec());
+         assert_eq!(query_result.unwrap(), expected);
+     }
//diff-add-end
  }
```

Note that:

- When arranging for the test, you keep the address string value for reuse.
- The expected string reads as a JSON, and that it is created with escaped characters
  made possible with `{{` and the raw string marker `r#...#`.
- `Binary::new(expected_response.as_bytes().to_vec())` converts to a binary.

After you run `cargo test`, it should print its success in the output:

```text
...
running 3 tests
test contract::tests::test_instantiate ... ok
test contract::tests::test_execute ... ok
test contract::tests::test_query ... ok
...
```

## Conclusion

You have created a query message and added its handling so that users and other smart contracts can check the registration status of names.

:::info Exercise progression

At this stage, you should have something similar to the
[`first-query-message`](https://github.com/b9lab/cw-my-nameservice/tree/first-query-message) branch,
with [this](https://github.com/b9lab/cw-my-nameservice/compare/first-execute-message..first-query-message) as the diff.

:::

So far your unit tests have only tested functions in isolation and run within Rust,
without touching WebAssembly or CosmWasm. You expand a bit in the next section by having
your functions interact with a mocked app chain.
