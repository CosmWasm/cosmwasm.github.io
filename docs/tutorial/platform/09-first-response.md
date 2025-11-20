---
title: First composed response
description: Return something more after execution.
---

# First composed response

As it stands, your `execute` function only returns a `Response::default()`. That is the bare minimum.
Eventually, as your smart contract communicates with others or even other modules, it needs to pass
more information as part of its response. This section is a step in this direction.

:::info Exercise progression

If you skipped the previous section, you can just switch the project to its
[`first-multi-test`](https://github.com/b9lab/cw-my-nameservice/tree/first-multi-test) branch and take it from there.

:::

## Add an event

A very simple thing to add to your response is an [event](https://docs.cosmwasm.com/core/architecture/events).
It is the same concept as [events in Cosmos](https://tutorials.cosmos.network/academy/2-cosmos-concepts/10-events.html).
You can add attributes to the `wasm` event that is added by the CosmWasm module itself, and is always present.

Better yet, you add your own event, which will mean something to those who interact with your smart contract.
Update your `src/contract.rs` with:

```rust title="src/contract.rs"
  ...

  use cosmwasm_std::{
//diff-del
-     entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
//diff-add-start
+     entry_point, to_json_binary, Binary, Deps, DepsMut, Env, Event, MessageInfo, Response,
+     StdResult,
//diff-add-end
  };

  ...

  fn execute_register(deps: DepsMut, info: MessageInfo, name: String) -> ContractResult {
      let key = name.as_bytes();
//diff-del      
-     let record = NameRecord { owner: info.sender };
//diff-add-start
+     let record = NameRecord {
+         owner: info.sender.to_owned(),
+     };
//diff-add-end

      ...

//diff-del
-     Ok(Response::default())
//diff-add-start
+     let registration_event = Event::new("name-register")
+         .add_attribute("name", name)
+         .add_attribute("owner", info.sender);
+     let resp = Response::default().add_event(registration_event);
+     Ok(resp)
//diff-add-end
  }

  ...
```

Note that:

- You are free to choose any event name other than `name-register`. You ought to make it a visible constant too.
- The CosmWasm module will prefix it with `wasm-` before sending the event as a Cosmos one.
- You can add more attributes in your event if the need arises.
- You can add more events to the response if you need or want to.

## Adjust the unit test

The response has changed, so must the unit test:

```rust title="src/contract.rs"
  ...

  mod tests {

      ...

//diff-del
-     use cosmwasm_std::{testing, Addr, Binary, Response};
//diff-add
+     use cosmwasm_std::{testing, Addr, Binary, Event, Response};

      ...

      fn test_execute() {

          ...

//diff-del
-         assert_eq!(contract_result.unwrap(), Response::default());
//diff-add-start
+         let received_response = contract_result.unwrap();
+         let expected_event = Event::new("name-register")
+             .add_attribute("name", name.to_owned())
+             .add_attribute("owner", mocked_addr.to_string());
+         let expected_response = Response::default().add_event(expected_event);
+         assert_eq!(received_response, expected_response);
//diff-add-end

          ...

      }

      ...

  }

  ...
```

Note that:

- The `assert_eq!` macro does a deep equal between the _received_ and _expected_ responses.
- Because you have only tested the function in isolation, the event name is not prefixed with `wasm-`.

## Adjust the mocked-app test

It needs modifying too:

```rust title="test/contract.rs"
//diff-del
- use cosmwasm_std::Addr;
//diff-add
+ use cosmwasm_std::{Addr, Event};

  ...

  fn test_register() {

      ...

      assert!(result.is_ok(), "Failed to register alice");
//diff-del      
-     let received_response = result.unwrap();
//diff-add-start
+     let expected_event = Event::new("wasm-name-register")
+         .add_attribute("name", name_alice.to_owned())
+         .add_attribute("owner", owner_addr_value.to_owned());
+     received_response.assert_event(&expected_event);
+     assert_eq!(received_response.data, None);
//diff-add-end
      ...

  }

  ...
```

Note that:

- Here, the received response is of type `AppResponse`, which contains your new event, and may eventually contain
  other events that would be emitted by other smart contracts that may have been called as part of `ExecuteMsg::Register`.
- This time, the mocked app prefixed the event with `wasm-`.
- The response has an `assert_event` function that calls `assert!` and `has_event` with a nice message
  so that you don't have to write it yourself.

## Conclusion

There is more to execution responses than events, as you will learn in subsequent sections.

:::info Exercise progression

At this stage, you should have something similar to the
[`first-event`](https://github.com/b9lab/cw-my-nameservice/tree/first-event) branch,
with [this](https://github.com/b9lab/cw-my-nameservice/compare/first-multi-test..first-event) as the diff.

:::
