---
title: First migration
description: Introduce a change in-flight.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# First migration

Your smart contract can now change its parameters via a Cosmos SDK governance proposal.

:::info Exercise progression

If you skipped the previous section, you can just switch:

- The `my-nameservice` project to its [`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch.
- The `my-collection-manager` project to its [`sudo-message`](https://github.com/b9lab/cw-my-collection-manager/tree/sudo-message) branch.

And take it from there.

:::

When you introduced the payment parameters into your smart contract, the change not only changed its code,
it also modified its storage layout. Because of that, swapping the code id of your smart contract would not have
re-executed the `instantiate` function. Therefore, an `execute` would always fail at the `PAYMENT_PARAMS.load(..)?` line.

You need something akin to the `instantiate` function, but for a smart contract that already exists.
That, and more, is the objective of a migration.

## The mechanism

A migration changes **atomically** two elements of a smart contract:

- Its code, which can be swapped at any time, as long as an administrator has been defined at instantiation.
- Its storage, which can be changed within the scope of a transaction; one that effects the migration.

You will define a new `migrate` entry point and, inside it, do the storage adjustments.

In this exercise, you have introduced `PaymentParams` in two steps.

* You added the storage element with just the `beneficiary: Addr` [here](./15-cross-module.md).
* You added `mint_price: Option<Coin>` to the existing object [here](./16-fund-handling.md).

You can imagine two different migration situations:

1. From no payment params, to a fully formed one.
2. From a half payment params, to a fully formed one.

_Fixing_ storage as part of the migration is fraught business. That's why, in this section:

* We handle the first case of going from no payment params to a fully formed one.
* We introduce versioning so that future migrations have a single value to check.

## A new dependency

To assist you with semantic versioning, you add the [`cw2` library](https://docs.rs/crate/cw2/1.1.2):

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        cargo add cw2@1.1.2
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add cw2@1.1.2
        ```
    </TabItem>
</Tabs>

The `cw2` library offers more than that, and in particular, it expects your smart contract to store information
about itself in storage. You will add that shortly.

## The message

Since the `migrate` function will store a new `PaymentParams`, your migration message needs to carry one:

```rust title="src/msg.rs"
  ...
  pub enum SudoMsg {
      UpdatePaymentParams(PaymentParams),
  }
// diff-add-start
+
+ #[cw_serde]
+ pub struct MigrateMsg {
+     pub payment_params: PaymentParams,
+ }
// diff-add-end
```

Note that although its content looks identical to the `InstantiateMsg`,
it is better to keep both message types separate to avoid confusion.

## A new error

Because a migrate function expects certain initial conditions, it should return an error if it does not recognize them.
The `cw2` library defines a `VersionError`, which it would be good to already include, even if,
at this stage, its use looks premature. Add a new error:

```rust title="src/error.rs"
  use cosmwasm_std::{Coin, StdError};
// diff-add
+ use cw2::VersionError;
  use thiserror::Error;
  ...
  pub enum ContractError {
      ...
      MissingPayment { missing_payment: Coin },
// diff-add-start
+     #[error("{0}")]
+     Version(#[from] VersionError),
// diff-add-end
  }
```

## Adjust `instantiate` with the contract version

This will be convenient for **future** migrations, not this one. Add two constants:

```rust title="src/state.rs"
  ...
  use crate::msg::PaymentParams;

// diff-add-start
+ pub const CONTRACT_NAME: &str = "my-collection-manager";
+ pub const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
// diff-add-end

  pub const PAYMENT_PARAMS: Item<PaymentParams> = Item::new("payment_params");
```

Note that:

- The version is taken from the Cargo package. This is up to you to change.
- You could also take the name from the Cargo package with `env!("CARGO_PKG_NAME")`.

```rust title="src/contract.rs"
  use crate::{
      ...
      msg::{
          ...
      },
// diff-del
-     state::PAYMENT_PARAMS,
// diff-add
+     state::{CONTRACT_NAME, CONTRACT_VERSION, PAYMENT_PARAMS},
  };
  ...
  use cosmwasm_std::{
      ...
  };
// diff-add
+ use cw2::set_contract_version;
  use cw721::msg::NumTokensResponse;

  type ContractResult = Result<Response, ContractError>;
  ...
  pub fn instantiate(deps: DepsMut, _: Env, _: MessageInfo, msg: InstantiateMsg) -> ContractResult {
      msg.payment_params.validate()?;
      PAYMENT_PARAMS.save(deps.storage, &msg.payment_params)?;
// diff-add
+     set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
// diff-del
-     let instantiate_event = Event::new("my-collection-manager");
// diff-add-start
+     let instantiate_event = Event::new("my-collection-manager")
+         .add_attribute("update-contract-version", CONTRACT_VERSION);
// diff-add-end
      let instantiate_event = append_payment_params_attributes(instantiate_event, msg.payment_params);
      ...
  }
  ...
```

Note that:

- As always when using a library, you need to make sure that you do not overwrite what the library is writing,
  in this case at the `"contract_info"` storage key.

:::tip

You added the `set_contract_version` line only now. However, this is only a tutorial constraint,
so that you discover what relates to migration in a single place. For your next smart contract,
you ought to add the `set_contract_version` line right at the beginning of the project.

:::

## The `migrate` entry point

This is where you change the storage layout of your smart contract as part of the migration:

```rust title="src/contract.rs"
  use crate::{
      ...
      msg::{
          CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, GetPaymentParamsResponse,
// diff-del
-         InstantiateMsg, NameServiceExecuteMsgResponse, PaymentParams, QueryMsg, SudoMsg,
// diff-add
+         InstantiateMsg, MigrateMsg, NameServiceExecuteMsgResponse, PaymentParams, QueryMsg, SudoMsg,
      },
      ...
  };
  ...
  use cosmwasm_std::{
      ...
  };
// diff-del
- use cw2::set_contract_version;
// diff-add
+ use cw2::{get_contract_version, set_contract_version, ContractVersion, VersionError};
  use cw721::msg::NumTokensResponse;

  fn sudo_update_payment_params(...) -> ContractResult {
      ...
  }
// diff-add-start
+
+ #[cfg_attr(not(feature = "library"), entry_point)]
+ pub fn migrate(deps: DepsMut, _env: Env, msg: MigrateMsg) -> ContractResult {
+     if let Ok(ContractVersion {
+         contract: _,
+         version,
+     }) = get_contract_version(deps.storage)
+     {
+         return Err(ContractError::Version(VersionError::WrongVersion {
+             expected: "0.0.0".to_owned(),
+             found: version,
+         }));
+     }
+     msg.payment_params.validate()?;
+     PAYMENT_PARAMS.save(deps.storage, &msg.payment_params)?;
+     set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
+     let migrate_event = Event::new("my-collection-manager")
+         .add_attribute("update-contract-version", CONTRACT_VERSION);
+     let migrate_event = append_payment_params_attributes(migrate_event, msg.payment_params);
+     Ok(Response::default().add_event(migrate_event))
+ }
// diff-add-end
  ...
```

Note that:

- The `if let Ok(ContractVersion {...}) = get_contract_version(...)` branch is unusual as the function
  returns an error when it finds an `ok` value. This reflects the fact that there was no contract version initially.
  A subsequent migration ought to either:
  - Use `assert_contract_version` to confirm that the smart contract is at the expected version before proceeding.
  - Or use `get_contract_version` to then branch depending on the value found. The older the version, the more changes would have to be applied.
- The rest of the actions otherwise look identical to the `instantiate` function. However, this may not always be the case. Each situation is unique.
- It emits an event for convenience.

## Unit tests

### On `instantiate`

Now that you save the version in storage, depending on the `cw2` library,
it is worth checking that it stored the right values:

```rust title="src/contract.rs"
  ...
  mod tests {
      ...
      use cosmwasm_std::{
          ...
      }
// diff-add
+     use cw2::{assert_contract_version, ContractVersion};
      use cw721::msg::NumTokensResponse;
      ...
      impl NumTokensMockQuerier {
          ...
      }

// diff-add-start
+     #[test]
+     fn test_instantiate() {
+         // Arrange
+         let mut mocked_deps_mut = mock_deps(NumTokensResponse { count: 3 });
+         let mocked_env = testing::mock_env();
+         let deployer = Addr::unchecked("deployer");
+         let mocked_msg_info = testing::mock_info(deployer.as_ref(), &[]);
+         let instantiate_msg = InstantiateMsg {
+             payment_params: PaymentParams {
+                 beneficiary: deployer,
+                 mint_price: None,
+             },
+         };
+ 
+         // Act
+         let result = super::instantiate(
+             mocked_deps_mut.as_mut(),
+             mocked_env.to_owned(),
+             mocked_msg_info,
+             instantiate_msg,
+         );
+ 
+         // Assert
+         assert!(result.is_ok(), "Failed to instantiate manager");
+         let received_response = result.unwrap();
+         let expected_response = Response::default().add_event(
+             Event::new("my-collection-manager")
+                 .add_attribute("update-contract-version", "0.1.0")
+                 .add_attribute("update-payment-params-beneficiary", deployer)
+                 .add_attribute("update-payment-params-mint-price", "none"),
+         );
+         assert_eq!(received_response, expected_response);
+         let saved_payment_params = PAYMENT_PARAMS
+             .load(&mocked_deps_mut.storage)
+             .expect("Failed to load payment params");
+         assert_eq!(saved_payment_params, payment_params);
+         assert_contract_version(&mocked_deps_mut.storage, "my-collection-manager", "0.1.0")
+             .expect("Failed to assert contract version");
+         let contract_info = cw2::CONTRACT
+             .load(&mocked_deps_mut.storage)
+             .expect("Failed to load contract info");
+         assert_eq!(
+             contract_info,
+             ContractVersion {
+                 contract: "my-collection-manager".to_owned(),
+                 version: "0.1.0".to_owned(),
+             }
+         );
+     }
// diff-add-end
      ...
  }
```

Note that:

- It contains the imports for all the new tests.
- The test checks the contract version in two different ways. The `assert_contract_version` is one you can actually
  call from a smart contract function if you want your migrate function to be valid for a single version value.
- It also checks the event introduced earlier.

### On `migrate`

```diff-rust title="src/contract.rs"
  ...
  mod tests {
      ...
      fn test_sudo_update_payment_params() {
          ...
      }
// diff-add-start
+
+     #[test]
+     fn test_migrate_payment_params() {
+         // Arrange
+         let mut mocked_deps_mut = testing::mock_dependencies();
+         let mocked_env = testing::mock_env();
+         let beneficiary = Addr::unchecked("beneficiary");
+         let new_payment_params = PaymentParams {
+             beneficiary: beneficiary.to_owned(),
+             mint_price: Some(Coin {
+                 denom: "silver".to_owned(),
+                 amount: Uint128::one(),
+             }),
+         };
+         let migrate_msg = MigrateMsg {
+             payment_params: new_payment_params.to_owned(),
+         };
+
+         // Act
+         let result = super::migrate(mocked_deps_mut.as_mut(), mocked_env, migrate_msg);
+
+         // Assert
+         assert!(result.is_ok(), "Failed to migrate manager");
+         let received_response = result.unwrap();
+         let expected_response = Response::default().add_event(
+             Event::new("my-collection-manager")
+                 .add_attribute("update-contract-version", "0.1.0")
+                 .add_attribute("update-payment-params-beneficiary", beneficiary)
+                 .add_attribute("update-payment-params-mint-price-denom", "silver")
+                 .add_attribute("update-payment-params-mint-price-amount", "1"),
+         );
+         assert_eq!(received_response, expected_response);
+         let saved_payment_params = PAYMENT_PARAMS
+             .load(&mocked_deps_mut.storage)
+             .expect("Failed to load payment params");
+         assert_eq!(new_payment_params, saved_payment_params);
+         assert_contract_version(&mocked_deps_mut.storage, "my-collection-manager", "0.1.0")
+             .expect("Failed to assert contract version");
+         let contract_info = cw2::CONTRACT
+             .load(&mocked_deps_mut.storage)
+             .expect("Failed to load contract info");
+         assert_eq!(
+             contract_info,
+             ContractVersion {
+                 contract: "my-collection-manager".to_owned(),
+                 version: "0.1.0".to_owned(),
+             }
+         );
+     }
// diff-add-end
  }
```

Note that:

- The _old_ `instantiate` function, pre-migration, did not save anything to storage, so when testing the migration,
  we do not need to run a mocked _old_ `instantiate`.
- It looks very much like `test_sudo_update_payment_params`.

## Mocked app tests

Conveniently, the `cw-multi-test` library offers
a [`migrate_contract`](https://github.com/CosmWasm/cw-multi-test/blob/v1.2.0/src/executor.rs#L168) function
that lets you atomically change the code and run the `migrate` function.

In this test, you need to create two _bytecodes_:

1. The initial one:
   - With an instantiate function that does not store any payment params.
   - Without migrate function.
2. The new one:
   - With an instantiate function that stores payment params.
   - With a migrate function.

The goal is to create the smart contract instance with the first bytecode,
then swap the code to the second one with `migrate_contract`, thereby:

- Skipping the instantiate function on the first bytecode.
- Calling the migrate function on the second bytecode.

The _Arrange_ part reflects these two steps:

```rust title="tests/contract.rs"
// diff-add
+ use std::fmt::Error;

// diff-add
+ use cosmwasm_schema::cw_serde;
// diff-del
- use cosmwasm_std::{Addr, Coin, Empty, Event, Uint128};
// diff-add
+ use cosmwasm_std::{Addr, Coin, DepsMut, Empty, Env, Event, MessageInfo, Response, Uint128};
  ...
  use cw_my_collection_manager::{
// diff-del-start
-     contract::{execute, instantiate, query, reply, sudo},
-     msg::{ExecuteMsg, GetPaymentParamsResponse, InstantiateMsg, PaymentParams, QueryMsg, SudoMsg}
// diff-del-end
// diff-add-start
+     contract::{execute, instantiate, migrate, query, reply, sudo},
+     msg::{ExecuteMsg, GetPaymentParamsResponse, InstantiateMsg, MigrateMsg, PaymentParams, QueryMsg, SudoMsg},
// diff-add-end
  }
  ...
  fn test_sudo_update_payment_params() {
      ...
  }
// diff-add-start
+
+ #[test]
+ fn test_migrate_payment_params() {
+     // Arrange old smart contract
+     #[cw_serde]
+     struct OldInstantiateMsg {}
+     let mut mock_app = App::default();
+     let admin_addr = Addr::unchecked("admin");
+     let old_code = Box::new(
+         ContractWrapper::new(
+             execute,
+             |_: DepsMut, _: Env, _: MessageInfo, _: OldInstantiateMsg| -> Result<Response, Error> {
+                 Ok(Response::default())
+             },
+             query,
+         )
+         .with_reply(reply)
+         .with_sudo(sudo),
+     );
+     let manager_old_code_id = mock_app.store_code(old_code);
+     let addr_manager = mock_app
+         .instantiate_contract(
+             manager_old_code_id,
+             Addr::unchecked("deployer-manager"),
+             &OldInstantiateMsg {},
+             &[],
+             "my-collection-manager",
+             Some(admin_addr.to_string()),
+         )
+         .expect("Failed to instantiate old collection manager");
+     // Arrange migration
+     let new_code = Box::new(
+         ContractWrapper::new(execute, instantiate, query)
+             .with_reply(reply)
+             .with_sudo(sudo)
+             .with_migrate(migrate),
+     );
+     let manager_new_code_id = mock_app.store_code(new_code);
+     let beneficiary_addr = Addr::unchecked("beneficiary");
+     let new_payment_params = PaymentParams {
+         beneficiary: beneficiary_addr.to_owned(),
+         mint_price: Some(Coin {
+             denom: "silver".to_owned(),
+             amount: Uint128::from(23u16),
+         }),
+     };
+     let migrate_msg = MigrateMsg {
+         payment_params: new_payment_params.to_owned(),
+     };
+ 
+     // Act
+     let result = mock_app.migrate_contract(
+         admin_addr,
+         addr_manager.to_owned(),
+         &migrate_msg,
+         manager_new_code_id,
+     );
+ 
+     // Assert
+     assert!(result.is_ok(), "Failed to migrate the contract");
+     let result = result.unwrap();
+     let expected_migrate_event = Event::new("migrate")
+         .add_attribute("_contract_address", addr_manager.to_owned())
+         .add_attribute("code_id", "2".to_owned());
+     result.assert_event(&expected_migrate_event);
+     let expected_migrate_event2 = Event::new("wasm-my-collection-manager")
+         .add_attribute("_contract_address", addr_manager.to_owned())
+         .add_attribute("update-contract-version", "0.1.0")
+         .add_attribute("update-payment-params-beneficiary", beneficiary_addr)
+         .add_attribute("update-payment-params-mint-price-denom", "silver")
+         .add_attribute("update-payment-params-mint-price-amount", "23");
+     result.assert_event(&expected_migrate_event2);
+     let result = mock_app
+         .wrap()
+         .query_wasm_smart::<GetPaymentParamsResponse>(&addr_manager, &QueryMsg::GetPaymentParams);
+     assert!(result.is_ok(), "Failed to query payment params");
+     assert_eq!(
+         result.unwrap(),
+         GetPaymentParamsResponse {
+             payment_params: new_payment_params
+         }
+     );
+ }      
// diff-add-end
```

Note how:

- The function defines a `struct OldInstantiateMsg` that reflects the state of `InstantiateMsg` before the change.
  In a larger project, you may want to have it as a clearly defined type.
- The function passes a lambda `|_, _, _, _| { ... }` as the `instantiate` function.
  It works here because the old `instantiate` function did not do anything special.
  In a larger project, you may want to define it inside another package imported as a development dependency.
- The old code is created without a `migrate` function, for a better simulation.
- The smart contract is instantiated with an admin. If it was left as `None`, like in the other test functions,
  then it would not be possible to swap the code.
- The new code contains the latest `instantiate` and `migrate` functions.
- The migrate call is made from the admin address.
- The assertions on events look a lot like `test_sudo_update_payment_params`, apart from the attribute on the new code id: `"2"`.

## Conclusion

You can now upgrade your smart contract from an earlier version.

:::info Exercise progression

At this stage:

- The `my-nameservice` project should still have something similar to the
  [`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch.
- The `my-collection-manager` project should have something similar to the
  [`migrate-function`](https://github.com/b9lab/cw-my-collection-manager/tree/migrate-function) branch,
  with [this](https://github.com/b9lab/cw-my-collection-manager/compare/sudo-message..migrate-function) as the diff.

:::

There is no test that shows the smart contract cannot be twice migrated. This is left as an exercise.
