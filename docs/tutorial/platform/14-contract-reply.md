---
title: First contract reply integration
description: Receive an asynchronous reply from a message sent to another smart contract.
---

# First contract reply integration

In a previous section, your _manager_ smart contract sent an asynchronous message to the _collection_ smart contract,
in a fire-and-forget manner.

:::info Exercise progression

If you skipped the previous section, you can just switch:

- The `my-nameservice` project to its [`add-nft-library`](https://github.com/b9lab/cw-my-nameservice/tree/add-nft-library) branch.
- The `my-collection-manager` project to its [`cross-contract-query`](https://github.com/b9lab/cw-my-collection-manager/tree/cross-contract-query) branch.

And take it from there.

:::

In fact, it is possible for the _caller_ to receive a response from the _callee_.
This is the object of this section. Your _name service_ smart contract is going to return some data after its execution.
And your _collection manager_ smart contract is going to receive and emit it.

## The use-case

After execution, the collection manager smart contract is going to emit how many tokens exist in the collection
after it has executed the latest command. Instead of launching another query to the collection,
as it does before returning the message, the manager is going to rely on the collection returning this information.
And because the manager has to remain able to work even with collections that don't return this information,
you will return default values it some situations.

It uses the [reply mechanism](https://docs.cosmwasm.com/core/entrypoints/reply) of the actor model.

## Update `my-nameservice`

Your name service is a particular implementation of the NFT library. It adds elements but remains compatible with it.
Returning some data at the end of the execution preserves compatibility with the NFT library.
So go back to the `my-nameservice` project.

### The returned type

Add the future returned information in `src/msg.rs`:

```rust title="src/msg.rs"
// diff-add
+ use cosmwasm_schema::cw_serde;
  use cosmwasm_std::Empty;
  ...
  pub type QueryMsg = Cw721QueryMsg<Option<Empty>, Option<Empty>, Empty>;

// diff-add-start
+ #[cw_serde]
+ pub struct ExecuteMsgResponse {
+     pub num_tokens: u64,
+ }
// diff-add-end
```
    
Note that:

- You name it neutrally such that it could conceivably be expanded.
- You could have used the library's `NumTokensResponse`, although it could become an issue when expanding
  with more fields in the future. And its field is named simply `count`, which could be confusing.

### Return from `execute`

With the type defined, you can now add a `.data` to the response:

```rust title="src/contract.rs"
  use crate::{
      error::ContractError,
// diff-del
-     msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
// diff-add
+     msg::{ExecuteMsg, ExecuteMsgResponse, InstantiateMsg, QueryMsg},
  }
  use cosmwasm_std::{
// diff-del
-     entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response,
// diff-add
+     entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response,
  };
  ...
  pub fn execute(
// diff-del
-     deps: DepsMut,
// diff-add
+     mut deps: DepsMut,
      env: Env,
      ...
  ) -> ContractResult {
// diff-del
-     Ok(Cw721EmptyExtensions::default().execute(deps, &env, &info, msg)?)
// diff-add-start
+     let library = Cw721EmptyExtensions::default();
+     Ok(library
+         .execute(deps.branch(), &env, &info, msg)
+         .inspect(|response| assert_eq!(response.data, None))?
+         .set_data(to_json_binary(&ExecuteMsgResponse {
+             num_tokens: library.query_num_tokens(deps.storage)?.count,
+         })?))
// diff-add-end
  }
```

Note how:

- You make the `deps` mutable. That's to be able to compile, because of the quirks of Rust. Open to a more elegant way.
- With `assert_eq!(response.data, None)`, you make sure that the NFT library returned no data.
  That's an insurance policy against overwriting if and when the library changes in the future.
- You do direct access to `.query_num_tokens`, which returns the convenient `NumTokensResponse`.
- You serialize the data to binary, as seen many times.

### Adjust the unit test

With a minor change to the returned object, you only have to adjust your expected response when testing `execute`:

```rust title="src/contract.rs"
  mod tests {
// diff-del
-     use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
// diff-add
+     use crate::msg::{ExecuteMsg, ExecuteMsgResponse, InstantiateMsg, QueryMsg};
// diff-del
-     use cosmwasm_std::{testing, Addr, Binary, Response};
// diff-add
+     use cosmwasm_std::{testing, to_json_binary, Addr, Binary, Response};
      ...
      fn test_execute() {
          ...
          let expected_response = Response::default()
// diff-add-start
+             .set_data(
+                 to_json_binary(&ExecuteMsgResponse { num_tokens: 1 })
+                     .expect("Failed to serialize counter"),
+             )
// diff-add-end
              .add_attribute("action", "mint")
          ...
      }
  }
```

Note that:

- After minting once on an empty library, you end up with a single token.

### Adjust the mocked-app test

On this test too, you just confirm that the data returned is as expected:

```rust title="test/contract.rs"
// diff-del
- use cosmwasm_std::{Addr, Event, StdError, Storage};
// diff-add
+ use cosmwasm_std::{to_json_binary, Addr, Event, StdError, Storage};
  ...
  use cw_my_nameservice::{
      contract::{execute, instantiate, query},
// diff-del
-     msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
// diff-add
+     msg::{ExecuteMsg, ExecuteMsgResponse, InstantiateMsg, QueryMsg},
  }
  ...
  fn test_register() {
      ...
      assert_eq!(
          received_response.data,
// diff-del
-         None,
// diff-add-start
+         Some(to_json_binary(&ExecuteMsgResponse { num_tokens: 1 })
+             .expect("Failed to serialize counter")),
// diff-add-end
      );
      ...
  }
```

### Intermediate conclusion on `my-name-service`

This completes this section's changes on `my-nameservice`.

:::info Exercise progression

At this stage the `my-nameservice` project should have something similar to the
[`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch,
with [this](https://github.com/b9lab/cw-my-nameservice/compare/add-nft-library..execute-return-data) as the diff.

:::

## Using it in the collection manager

Your update of my name service was rather straightforward. Back in `my-collection-manager`,
you now need to make use of it as part of the reply mechanism. You are going to:

- Define a new data carrying type.
- Define a set of return codes for branching.
- Instruct the system that you expect a reply.
- Add the `reply` entry point.
- Adjust and add to your tests.

### The expected type

Similarly to the type you defined in `my-nameservice`, you define it here a second time.
By re-defining it, you avoid having to import `my-nameservice`, which would be overkill.

```rust title="src/msg.rs"
#[cw_serde]
pub struct NameServiceExecuteMsgResponse {
    pub num_tokens: u64,
}
```

Note how:

- The name is pointedly specific as it is indeed copied from `my-nameservice`.

### Define the reply codes

Because all replies come through the same `reply` entry point, there needs to be a mechanism to distinguish between call types.
The library does this by way of an `id: u64`. You provide this `id` when sending a message that expects a reply,
and the CosmWasm module will ensure that the same `id` is part of the reply object.

It is in your interest to clearly identify what each value mean. One way to achieve it is with constants.
Another, more elegant, way is with an enum that maps to a number:

```rust title="src/contract.rs"
  use crate::{
      error::ContractError,
      msg::{
// diff-del
-         CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, InstantiateMsg,
// diff-add
+         CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, InstantiateMsg, NameServiceExecuteMsgResponse,
      },
  }
  ...
  use cosmwasm_std::{
// diff-del
-     to_json_binary, DepsMut, Env, Event, MessageInfo, QueryRequest, Response, WasmMsg, WasmQuery,
// diff-add-start
+     from_json, to_json_binary, CosmosMsg, DepsMut, Empty, Env, Event, MessageInfo, QueryRequest,
+     Reply, ReplyOn, Response, StdError, SubMsg, WasmMsg, WasmQuery,
// diff-add-end
  }
  ...
  type ContractResult = Result<Response, ContractError>;

// diff-add-start
+  enum ReplyCode {
+      PassThrough = 1,
+  }
+  
+  impl TryFrom<u64> for ReplyCode {
+      type Error = ContractError;
+      
+      fn try_from(item: u64) -> Result<Self, Self::Error> {
+          match item {
+              1 => Ok(ReplyCode::PassThrough),
+              _ => panic!("invalid ReplyCode({})", item),
+          }
+      }
+  }
// diff-add-end
   ...
```

Note that:

- The name `PassThrough` harks back to its `ExecuteMsg` namesake variant, but it need not be.
  It just so happens to be pertinent in this case.
- The unsightly unknown case `_ =>` is extracted in the `From` implementation so that, when using `::from`,
  you can use a succinct `match` on the enum that ensure exhaustiveness at compile time.
- You panic in the unknown case, instead of returning an error, because this case reveals a developer error,
  not a user error:
  - Either you defined a new id value without creating its corresponding entry in the enum.
  - Or the CosmWasm module unexpectedly called your smart contract on `reply`.
- Unlike when developing with the Cosmos SDK, a panic in a CosmWasm smart contract does not stop the consensus dead.
  That would be too easy a vector of attack. Instead, it reverts the transaction.
- The `= 1`, truly is of type `isize`, not `u64`, but at this small scale, there is zero risk of incompatibility.

### Adjust `execute_pass_through`

In the current use case, only the pass-through command expects a reply, so you make the change in `execute_pass_through`.
Earlier you added a message to the response. Now you have to wrap this message to make it a sub-message, with additional reply information:

```rust title="src/contract.rs"
  ...
  pub fn execute_pass_through(
      ...
  ) -> ContractResult {
      ...
      let onward_exec_msg = WasmMsg::Execute {
          ...
      };
// diff-add-start
+     let onward_sub_msg = SubMsg {
+         id: ReplyCode::PassThrough as u64,
+         msg: CosmosMsg::<Empty>::Wasm(onward_exec_msg),
+         reply_on: ReplyOn::Success,
+         gas_limit: None,
+     };
// diff-add-end
      let token_count_result =
      ...
      Ok(Response::default()
// diff-del
-         .add_message(onward_exec_msg)
// diff-add
+         .add_submessage(onward_sub_msg)
          .add_event(token_count_event))
  }
  ...
```

Note how:

- You set the `id` in the `SubMsg` to identify the type of reply, as explained earlier.
- The sub-message contains the original message in `.msg`.
- With the use of `CosmosMsg::Wasm`, you can already foresee that a sub-message can be used to send a message
  to something other than another smart contract. It can be sent to another Cosmos module.
- You are asking for a reply only in case of a `Success`. That's because you want to add information
  to the transaction in case of success. In case of failure, you do not care, other than that the system rolls back
  everything as it is designed to do by default.
  You can learn more about the different reply cases [here](https://docs.cosmwasm.com/core/entrypoints/reply).
- You can define a gas limit. In fact, if your goal is to add a gas limit to the original message,
  using a sub-message is the way to go, whether you intend on receiving a reply or not.

### Introduce the reply entry point

With the request for a reply prepared, you have to create the entry point proper.
This is a new entry point, just like `instantiate` and `execute`. As in `execute`,
you want to keep it expandable and readable. Therefore, you only keep a `match` statement in it:

```rust title="src/contract.rs"
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn reply(deps: DepsMut, env: Env, msg: Reply) -> ContractResult {
    match ReplyCode::try_from(msg.id)? {
        ReplyCode::PassThrough => reply_pass_through(deps, env, msg),
    }
}

fn reply_pass_through(_deps: DepsMut, _env: Env, msg: Reply) -> ContractResult {
    let resp = msg.result.into_result().map_err(StdError::generic_err)?;
    let data = if let Some(data) = resp.data {
        data.0[2..].to_vec()
    } else {
        return Ok(Response::default());
    };
    let value = if let Ok(value) = from_json::<NameServiceExecuteMsgResponse>(data) {
        value
    } else {
        return Ok(Response::default());
    };
    let event = Event::new("my-collection-manager")
        .add_attribute("token-count-after", value.num_tokens.to_string());
    Ok(Response::default().add_event(event))
}
```

Note that:

- It panics if:
  - It cannot identify the message `id`.
  - The data contains less than 2 bytes.
- It fails with an error if:
  - The `msg.result` has an error indicating that the remote execution failed.
    In practice this should not happen, because you sent the sub-message with `ReplyOn::Success`.
- On the other hand, it does not fail, but instead returns an `Ok(Response::default())`, if:
  - The response's data is empty. This is a valid situation, for instance, when the reply comes from a contract
    that uses an unmodified NFT library, unlike `my-nameservice`.
  - The response data cannot be deserialized to a `NameServiceExecuteMsgResponse`. This is a valid situation
    whereby the reply comes from a smart contract that sends something but unknown as of now.
- The binary returned is prefixed with two bytes: `0A` and the number of bytes that follow.
  This explains the `[2..]` operation to get rid of these first 2 bytes. This part could be improved
  to be more idiomatic to CosmWasm. And perhaps also more performant.
- The `.map_err(StdError::generic_err)` is there to convert a `String` into a `StdErr` so that you can benefit
  from the automatic conversion on `?`.
- The new event has a `token-count-after` attribute, as opposed to the previously seen `token-count-before`.

### Adjust the `execute` unit test

You modified the message returned in `execute`, so you need to adjust the corresponding assertions:

```rust title="src/contract.rs"
  mod tests {
// diff-del
-     use crate::msg::{CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg};
// diff-add-start
+     use crate::{
+         contract::ReplyCode,
+         msg::{
+             CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, NameServiceExecuteMsgResponse,
+         },
+     };
// diff-add-end
      use cosmwasm_std::{
          ...
          testing::{self, MockApi, MockQuerier, MockStorage},
// diff-del-start
-         to_json_binary, Addr, Coin, ContractResult, Empty, Event, OwnedDeps, Querier,
-         QuerierResult, QueryRequest, Response, SystemError, SystemResult, Uint128, WasmMsg,
-         WasmQuery,
// diff-del-end
// diff-add-start
+         to_json_binary, Addr, Binary, Coin, ContractResult, CosmosMsg, Empty, Event, OwnedDeps,
+         Querier, QuerierResult, QueryRequest, Reply, ReplyOn, Response, SubMsg, SubMsgResponse,
+         SubMsgResult, SystemError, SystemResult, Uint128, WasmMsg, WasmQuery,
// diff-add-end
      }
      ...
      fn test_pass_through() {
          ...
          let expected_response = Response::default()
// diff-del-start
-             .add_message(WasmMsg::Execute {
-                   contract_addr: "collection".to_owned(),
-                   msg: to_json_binary(&inner_msg).expect("Failed to serialize inner message"),
-                   funds: vec![fund_sent],
// diff-del-end
// diff-add-start
+             .add_submessage(SubMsg {
+                 id: ReplyCode::PassThrough as u64,
+                 msg: CosmosMsg::<Empty>::Wasm(WasmMsg::Execute {
+                     contract_addr: "collection".to_owned(),
+                     msg: to_json_binary(&inner_msg).expect("Failed to serialize inner message"),
+                     funds: vec![fund_sent],
+                 }),
+                 reply_on: ReplyOn::Success,
+                 gas_limit: None,
// diff-add-end
              })
              ...
      }
  }
```

Note that:

* You reused the expected message but also wrapped it in a sub-message.

### Unit-test the reply

With a new entry point, it is worth testing it in isolation.
You check that your new reply function returns the expected response.
Add a brand-new test:

```rust title="src/contract.rs"
#[test]
fn test_reply_pass_through() {
    // Arrange
    let mut mocked_deps_mut = mock_deps(NumTokensResponse { count: 3 });
    let mocked_env = testing::mock_env();
    let num_tokens = to_json_binary(&NameServiceExecuteMsgResponse { num_tokens: 4 })
        .expect("Failed to serialize counter");
    let mut prefixed_num_tokens = vec![10, 16];
    prefixed_num_tokens.extend_from_slice(num_tokens.as_slice());
    let reply = Reply {
        id: ReplyCode::PassThrough as u64,
        result: SubMsgResult::Ok(SubMsgResponse {
            data: Some(Binary::from(prefixed_num_tokens)),
            events: vec![],
        }),
    };

    // Act
    let contract_result = super::reply(mocked_deps_mut.as_mut(), mocked_env, reply);

    // Assert
    assert!(contract_result.is_ok(), "Failed to pass reply through");
    let received_response = contract_result.unwrap();
    let expected_response = Response::default()
        .add_event(Event::new("my-collection-manager").add_attribute("token-count-after", "4"));
    assert_eq!(received_response, expected_response);
}
```

Note that:

- There is some trickery to account for the fact that 2 bytes are removed. The test prepends those 2 bytes.
- When unit testing your reply in isolation, you do not need to have had an `execute` beforehand.

### Adjust your mocked-app test

A mocked app test gets you closer to how it would behave with the CosmWasm module.
In effect, the mocked app will call `reply` on your smart contract as necessary.
That is, if you _compile_ your smart contract with the `reply` function too.

So the updates are minor, plus you do not need to add a test specifically for the reply function.

```rust title="tests/contract.rs"
  ...
  use cw_my_collection_manager::{
// diff-del
-     contract::{execute, instantiate},
// diff-add
+     contract::{execute, instantiate, reply},
      msg::{ExecuteMsg, InstantiateMsg},
  };
  ...
  fn instantiate_collection_manager(mock_app: &mut App) -> (u64, Addr) {
      let code = Box::new(
          ContractWrapper::new(execute, instantiate, |_, _, _: ()| {
              to_json_binary("mocked_manager_query")
// diff-del
-         }),
// diff-add-start
+         })
+         .with_reply(reply),
// diff-add-end
      );
      ...
  }
  ...
  fn test_mint_through() {
      ...
      let expected_manager_event =
          Event::new("wasm-my-collection-manager").add_attribute("token-count-before", "0");
      result.assert_event(&expected_manager_event);
// diff-add-start
+     let expected_manager_event =
+         Event::new("wasm-my-collection-manager").add_attribute("token-count-after", "1");
+     result.assert_event(&expected_manager_event);
// diff-add-end
      ...
  }
  ...
  fn test_mint_num_tokens() {
      ...
      let expected_manager_event =
          Event::new("wasm-my-collection-manager").add_attribute("token-count-before", "1");
      result.assert_event(&expected_manager_event);
// diff-add-start
+     let expected_manager_event =
+         Event::new("wasm-my-collection-manager").add_attribute("token-count-after", "2");
+     result.assert_event(&expected_manager_event);
// diff-add-end
      ...
  }
```

Note that:

- The `token-count-before` event emitted in the `execute` and the `token-count-after` in `reply` are separate
  and not merged, although they have the same type. This is how the mocked app is implemented in this version.

## Conclusion

Your manager smart contract now:

- Sends a sub-message to another smart contract, with the expectation of a reply.
- Receives and understands the reply, which it uses to emit an event.

You could add more tests to verify that:

- It panics when receiving a bad reply `id`.
- I can handle replies with empty data.

This is left as an exercise.

:::info Exercise progression

At this stage:

- The `my-nameservice` project should have something similar to the
  [`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch,
  with [this](https://github.com/b9lab/cw-my-nameservice/compare/add-nft-library..execute-return-data) as the diff.
- The `my-collection-manager` project should have something similar to the
  [`reply-from-execute`](https://github.com/b9lab/cw-my-collection-manager/tree/reply-from-execute) branch,
  with [this](https://github.com/b9lab/cw-my-collection-manager/compare/cross-contract-query..reply-from-execute) as the diff.

:::

You just saw the use of `CosmosMsg::Wasm`. In the next section,
you use other variants of `CosmosMsg` to interact with Cosmos modules.
