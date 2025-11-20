---
title: Use the ownable library
description: Add a feature by incorporating code from elsewhere.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Use the ownable library

Your smart contract lets anyone register names. This sounds a bit too much like the dot-com rush
and its notorious domain parking. You may want to introduce some order. For instance, in the future,
only an auction smart contract may eventually be allowed to register names to auction winners.

A regular word used for such a _name registerer_ is **minter**. In this section you add a minter to your smart contract,
and have it gatekeep the register function.

Ideally, your smart contract should make it possible to update the minter, or have the minter be able to pass the baton.
This sounds a lot like the _ownable_ pattern found in blockchain, for instance in Ethereum.

In fact, there is [such a thing](https://github.com/larry0x/cw-plus-plus/tree/main/packages/ownable)
too in the CosmWasm ecosystem. In this section, you delegate to it:

- The storage definition.
- The update mechanics.
- The message types.

:::info Exercise progression

If you skipped the previous section, you can just switch the project to its
[first-event](https://github.com/b9lab/cw-my-nameservice/tree/first-event) branch and take it from there.

:::

## Add the dependency

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        cargo add cw-ownable@2.1.0
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add cw-ownable@2.1.0
        ```
    </TabItem>
</Tabs>


## Add the storage element

The object that defines access to the minter in storage is
 [`OwnershipStore`](https://github.com/larry0x/cw-plus-plus/blob/ownable-v2.1.0/packages/ownable/src/lib.rs#L31).
Note how it not only stores the [`owner`](https://github.com/larry0x/cw-plus-plus/blob/ownable-v2.1.0/packages/ownable/src/lib.rs#L19),
but also a [`pending_owner`](https://github.com/larry0x/cw-plus-plus/blob/ownable-v2.1.0/packages/ownable/src/lib.rs#L23),
which has to accept an invitation to become the new minter.

In your situation, the variables are named `owner` inside the library, but when used in your smart contract,
you will use the word _minter_ to avoid confusion. Update `src/state.rs`:

```rust title="src/state.rs"
  ...

  use cosmwasm_std::Addr;
//diff-add
+ use cw_ownable::OwnershipStore;
  use cw_storage_plus::Map;

  ...

  pub const NAME_RESOLVER: Map<&[u8], NameRecord> = Map::new("name_resolver");
//diff-add  
+ pub const MINTER: OwnershipStore = OwnershipStore::new("name_minter");

  ...
```

## Add new message variants

Only the new minter will be allowed to register new names. So it is a good first step to have this address set
when deploying the instance. Add it to `InstantiateMsg`:

```rust title="src/msg.rs"
  ...

  #[cw_serde]
//diff-del  
- pub struct InstantiateMsg {}
//diff-add-start
+ pub struct InstantiateMsg {
+     pub minter: String,
+ }
//diff-add-end

  ...
```

Eventually, you could imagine making this optional and have another function that lets one set the minter.
A straight string keeps things simple for now.

When time comes to register a name, the message will have to be sent from the minter.
However, at the moment, the smart contract takes the sender of the message as the eventual name owner.
So you need to change the message so that the owner is mentioned:

```rust title="src/msg.rs"
  use cosmwasm_schema::{cw_serde, QueryResponses};
//diff-add  
+ use cosmwasm_std::Addr;

  ...

  pub struct ExecuteMsg {
//diff-del
-     Register { name: String },
//diff-add
+     Register { name: String, owner: Addr },
  }

  ...
```

The `QueryMsg` does not need to change as querying does not involve the minter.

## Add handling at instantiation

This is where the smart contract saves to storage the _minter_ information it received:

```rust title="src/contract.rs"
  use crate::{
//diff-add  
-     state::{NameRecord, NAME_RESOLVER},
//diff-del
+     state::{NameRecord, MINTER, NAME_RESOLVER},
  }

  ...

  pub fn instantiate(
//diff-del
-     _deps_: DepsMut,
//diff-add
+     deps: DepsMut,
      _: Env,
      _: MessageInfo,
//diff-del
-     _msg_: InstantiateMsg
//diff-add
+     msg: InstantiateMsg
  ) -> ContractResult {
//diff-add  
+     let _ = MINTER.initialize_owner(deps.storage, deps.api, Some(msg.minter.as_str()))?;
      Ok(Response::default())
  }

  ...
```

Note how:

- It uses this [`initialiaze_owner`](https://github.com/larry0x/cw-plus-plus/blob/ownable-v2.1.0/packages/ownable/src/lib.rs#L45)
  function defined in the library.
- The function can erase the minter if you pass `None` instead of `Some`.
- It may return a `StdErr`, in which case the error is returned thanks to the trailing `?`.
- The returned `StdErr` is still transformed into a `ContractError::Std` thanks to the `from` macro `Std(#[from] StdError)`.
- You do not use the returned `Ownership<Addr>` since you know what it is.

## Add handling at name registration

This is where the smart contract verifies that it is the minter that is sending the message. You need to:

1. Destructure the message to extract the eventual name owner.
2. Verify that the message sender is the minter.
3. Adjust the record and the event with the proper owner.

The verification may yield an error. So you add a new error type to make it explicit,
and add a convenience curried function that will come in handy when propagating errors:

```diff-rust title="src/error.rs"
  use cosmwasm_std::StdError;
//diff-add  
+ use cw_ownable::OwnershipError;
  use thiserror::Error;

  ...

  pub enum ContractError {
      ...
      NameTaken { name: String },
//diff-add-start      
+     #[error("Caller ({caller}) is not minter")]
+     Minter {
+         caller: String,
+         inner: OwnershipError,
+     },
//diff-add-end
  }
//diff-add-start
+
+ impl ContractError {
+     pub fn from_minter<'a>(caller: &'a Addr) -> impl Fn(OwnershipError) -> ContractError + 'a {
+         move |inner: OwnershipError| ContractError::Minter {
+             caller: caller.to_string(),
+             inner,
+         }
+     }
+ }
//diff-add-end
```

Note that:

- The message could be refined eventually, but it will do for now. The error message mentions the caller for convenience.
- The `from_minter` function returns a closure.

Now you can update the handling:

```rust title="src/contract.rs"
  use cosmwasm_std::{
//diff-del  
-     entry_point, to_json_binary, Binary, Deps, DepsMut, Env, Event, MessageInfo, Response,
//diff-add
+     entry_point, to_json_binary, Addr, Binary, Deps, DepsMut, Env, Event, MessageInfo, Response,
      StdResult,
  };

  ...

  pub fn execute(
      ...
  ) -> ContractResult {
      match msg {
//diff-del      
-         ExecuteMsg::Register { name } => execute_register(deps, info, name),
//diff-add
+         ExecuteMsg::Register { name, owner } => execute_register(deps, info, name, &owner),
      }
  }

  ...

  fn execute_register(
      ...
      name: String,
//diff-add      
+     owner: &Addr,
  ) -> ContractResult {
//diff-add-start  
+     MINTER
+         .assert_owner(deps.storage, &info.sender)
+         .map_err(ContractError::from_minter(&info.sender))?;
//diff-add-end
      let key = name.as_bytes();
      let record = NameRecord {
//diff-del      
-         owner: info.sender.to_owned(),
//diff-add
+         owner: owner.to_owned(),
      };

      ...

      let registration_event = Event::new("name-register")
          .add_attribute("name", name)
//diff-del          
-         .add_attribute("owner", info.sender);
//diff-add
+         .add_attribute("owner", owner.to_string());
      let resp = Response::default().add_event(registration_event);

      ...
  }  
```

Note how:

- It is using the [`assert_owner`](https://github.com/larry0x/cw-plus-plus/blob/ownable-v2.1.0/packages/ownable/src/lib.rs#L77)
  function of the library. This is production function, now one reserved for tests.
- This function potentially returns a `OwnershipError`, which is why you use a `map_error` to transform the `Result`
  into a `Err(ContractError::Minter)` using the curried function defined earlier.
- Here too, the trailing `?` is used to return the eventual error.
- Other than that, it is just a matter of replacing the `sender` with the `owner`.

## Adjust unit tests

With the handling done, you need to update tests, starting with the unit tests.

:::tip

The Ownable library makes calls to [`Api.addr_validate`](https://github.com/larry0x/cw-plus-plus/blob/ownable-v2.1.0/packages/ownable/src/lib.rs#L52).
Unfortunately in CosmWasm 2.0, the `MockApi.addr_validate` does not replace this function with a dummy check.
So `Addr::unchecked` will not work. Fortunately, it is still possible to create relatively dummy addresses.

:::

To test the instantiation you will:

1. Create a quasi-proper minter address.
2. Confirm it was recorded in storage.

```rust title="src/contract.rs"
  ...
  
  mod tests {
      use crate::{
          msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
//diff-del         
-         state::{NameRecord, NAME_RESOLVER},
//diff-add
+         state::{NameRecord, MINTER, NAME_RESOLVER},
      };
//diff-del      
-     use cosmwasm_std::{testing, Addr, Binary, Event, Response};
//diff-add
+     use cosmwasm_std::{testing, Addr, Api, Binary, CanonicalAddr, Event, Response};
      
      ...

      fn test_instantiate() {
          // Arrange
          ...
          let mocked_msg_info = testing::message_info(&mocked_addr, &[]);
//diff-add-start          
+         let minter = mocked_deps_mut
+             .api
+             .addr_humanize(&CanonicalAddr::from("minter".as_bytes()))
+             .expect("Failed to create minter address");
-         let instantiate_msg = InstantiateMsg {};
+         let instantiate_msg = InstantiateMsg {
+             minter: minter.to_string(),
+         };
//diff-add-end
          ...

          // Assert
          ...
          assert_eq!(contract_result.unwrap(), Response::default());
//diff-add-start          
+         assert!(MINTER
+             .assert_owner(&mocked_deps_mut.storage, &minter)
+             .is_ok());
//diff-add-end
      }
  }  
```

Note how:

- You need to import `cosmwasm_std::Api` to have access to `addr_humanize`
- The `Act` part remains unchanged.

Similarly, you adjust the `test_execute`. You can choose to mimic a proper instantiation or directly
manipulate the `MINTER` object. Here, it is mimicking an instantiation:

```rust title="src/contract.rs"
  ...
  
  mod tests {
      ...

      fn test_execute() {
          // Arrange
          ...
          let mocked_addr = Addr::unchecked("addr");
//diff-add-start          
+         let minter = mocked_deps_mut
+             .api
+             .addr_humanize(&CanonicalAddr::from("minter".as_bytes()))
+             .expect("Failed to create minter address");
+         let _ = super::instantiate(
+             mocked_deps_mut.as_mut(),
+             mocked_env.to_owned(),
+             testing::message_info(&mocked_addr, &[]),
+             InstantiateMsg {
+                 minter: minter.to_string(),
+             },
+         )
+         .expect("Failed to instantiate");
//diff-add-end
//diff-del
-         let mocked_msg_info = testing::message_info(&mocked_addr, &[]);
//diff-add
+         let mocked_msg_info = testing::message_info(&minter, &[]);
          let name = "alice".to_owned();
//diff-add          
+         let owner = Addr::unchecked("owner");
//diff-del
-         let execute_msg = ExecuteMsg::Register { name: name.clone() };
//diff-add-start
+         let execute_msg = ExecuteMsg::Register {
+             name: name.clone(),
+             owner: owner.to_owned(),
+         };
//diff-add-end
          ...

          // Assert
          ...
          let expected_event = Event::new("name-register")
              .add_attribute("name", name.to_owned())
//diff-del               
-             .add_attribute("owner", mocked_addr.to_string());
//diff-add
+             .add_attribute("owner", owner.to_string());
          ...
//diff-del          
-         assert_eq!(stored.unwrap(), NameRecord { owner: mocked_addr });
//diff-add
+         assert_eq!(stored.unwrap(), NameRecord { owner: owner });
      }
  }  
```

Note how:

- The _Arrange_ part is much longer.

As for the `test_query`, you have to add more preparation:

```rust title="src/contract.rs"
  ...
  
  mod tests {
      ...

      fn test_query() {
          // Arrange
          ...
          let mocked_addr = Addr::unchecked(mocked_addr_value.clone());
//diff-add-start          
+         let minter = mocked_deps_mut
+             .api
+             .addr_humanize(&CanonicalAddr::from("minter".as_bytes()))
+             .expect("Failed to create minter address");
+         let _ = super::instantiate(
+             mocked_deps_mut.as_mut(),
+             mocked_env.to_owned(),
+             testing::message_info(&mocked_addr, &[]),
+             InstantiateMsg {
+                 minter: minter.to_string(),
+             },
+         )
+         .expect("Failed to instantiate");
//diff-add-end
//diff-del
-         let mocked_msg_info = testing::message_info(&mocked_addr, &[]);
//diff-add
+         let mocked_msg_info = testing::message_info(&minter, &[]);
//diff-del-start
-         let _ = super::execute_register(mocked_deps_mut.as_mut(), mocked_msg_info, name.clone())
-             .expect("Failed to register alice");
//diff-del-end
//diff-add-start
+         let _ = super::execute_register(
+             mocked_deps_mut.as_mut(),
+             mocked_msg_info,
+             name.clone(),
+             &mocked_addr,
+         )
+         .expect("Failed to register alice");
//diff-add-end
          ...
      }
  }  
```

Note how:

- Only the _Arrange_ part is modified.

## Add to unit tests

To complete the picture, you ought to add tests to cover the case where an account other than the minter tries to register a name.

## Adjust mocked app tests

Similarly, the mocked app tests need to be adjusted. In fact, you do not have much to modify as it is mostly
a matter of setting a proper minter to permit actions. You modify the `instantiate_nameservice` convenience function
to also return the minter, for reuse from the test proper:

```rust title="tests/contract.rs"
//diff-del
- use cosmwasm_std::{Addr, Event};
//diff-add
+ use cosmwasm_std::{Addr, Api, CanonicalAddr, Event};
  
//diff-add-start  
+ type ContractAddr = Addr;
+ type MinterAddr = Addr;
//diff-add-end

//diff-del
- fn instantiate_nameservice(mock_app: &mut App) -> (u64, Addr) {
//diff-add
+ fn instantiate_nameservice(mock_app: &mut App) -> (u64, ContractAddr, MinterAddr) {
      ...
      let nameservice_code_id = mock_app.store_code(nameservice_code);
//diff-add-start      
+     let minter = mock_app
+         .api()
+         .addr_humanize(&CanonicalAddr::from("minter".as_bytes()))
+         .unwrap();
//diff-add-end
      return (
          nameservice_code_id,
          mock_app
              .instantiate_contract(
                  nameservice_code_id,
                  Addr::unchecked("deployer"),
//diff-del                  
-                 &InstantiateMsg {},
//diff-add-start
+                 &InstantiateMsg {
+                     minter: minter.to_string(),
+                 },
//diff-add-end
                  &[],
                  "nameservice",
                  None,
              )
              .expect("Failed to instantiate nameservice"),
//diff-add              
+         minter,
      );
  }
```

Note that the type aliases are here only as syntactic sugar to disambiguate the two returned `Addr`.

With this done, you can adjust `test_register`:

```rust title="tests/contract.rs"
  fn test_register() {
      ...
//diff-del      
-     let (_, contract_addr) = instantiate_nameservice(&mut mock_app);
//diff-add
+     let (_, contract_addr, minter) = instantiate_nameservice(&mut mock_app);
      ...
      let register_msg = ExecuteMsg::Register {
          name: name_alice.to_owned(),
//diff-add          
+         owner: owner_addr.to_owned(),
      };
      ...
      let result = mock_app.execute_contract(
//diff-del      
-         owner_addr.clone(),
//diff-add
+         minter,
          ...
      );
      ...
  }
```
    
And both `test_query` functions:

```rust title="tests/contract.rs"
  fn test_query() {
      ...
//diff-del      
-     let (_, contract_addr) = instantiate_nameservice(&mut mock_app);
//diff-add
+     let (_, contract_addr, minter) = instantiate_nameservice(&mut mock_app);
      ...
      let register_msg = ExecuteMsg::Register {
          name: name_alice.to_owned(),
//diff-add          
+         owner: owner_addr.to_owned(),
      };
      ...
      let _ = mock_app
          .execute_contract(
//diff-del          
-             owner_addr.clone(),
//diff-add
+             minter,
          ...
          )
      ...
  }
  ...
  fn test_query_empty() {
      ...
//diff-del      
-     let (_, contract_addr) = instantiate_nameservice(&mut mock_app);
//diff-add
+     let (_, contract_addr, _) = instantiate_nameservice(&mut mock_app);
      ...
  }
```

## Add to mocked app tests

The introduction of the minter warrants further testing. In particular:

- Test that the minter was saved at instantiation.
- Test that it is not possible to register a name from another account than the minter.

This is left as an exercise.

## Conclusion

You have used a library that embeds some assumptions about access to storage, delegated some operations to it,
and confirmed with tests that it works. This library can do a lot more, including modifying the minter. As an exercise, you may want to:

- Add a `QueryMsg` variant to query the minter's current status.
- Add a `ExecuteMsg` variant to pass an [Action](https://github.com/larry0x/cw-plus-plus/blob/ownable-v2.1.0/packages/ownable/src/lib.rs#L211)
  to the minter ownership object.

What you have done is all within a single smart contract, it is not cross-contract message exchange.

:::info Exercise progression

At this stage, you should have something similar to the
[`add-first-library`](https://github.com/b9lab/cw-my-nameservice/tree/add-first-library) branch,
with [this](https://github.com/b9lab/cw-my-nameservice/compare/first-event..add-first-library) as the diff.

:::

[such a thing]: https://github.com/larry0x/cw-plus-plus/tree/main/packages/ownable
