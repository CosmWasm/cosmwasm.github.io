---
title: First Cross-Module Integration
description: Send a message to another Cosmos module, break the CosmWasm barrier.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# First Cross-Module Integration

In the previous sections, you made your _collection manager_ smart contract sends funds onwards to the _NFT collection_ smart contract. That's convenient from the point of view of the manager, although this kicks the can down to the NFT collection.

<HighlightBox type="info" title="Exercise progression">

If you skipped the previous section, you can just switch:

* The `my-nameservice` project to its [`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch.
* The `my-collection-manager` project to its [`reply-from-execute`](https://github.com/b9lab/cw-my-collection-manager/tree/reply-from-execute) branch.

And take it from there.

</HighlightBox>

## The use-case

You foresee your collection manager smart contract becoming a market place where owners sell their registered names. For this to happen, your smart contract needs to handle funds properly and therefore to be able to send appropriate messages to the app-chain's bank module.

As a first step, you change your manager contract so that it sends the received funds to a beneficiary address, instead of sending them to the NFT collection.

## Add a storage library

The address of the beneficiary of these funds is information that needs to be to be stored in storage and so set at instantiation. Add the `cw-storage-plus` library:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        cargo add cw-storage-plus@1.2.0
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add cw-storage-plus@1.2.0
        ```
    </TabItem>
</Tabs>

## New elements

The beneficiary is an address that is valid for the whole contract. As you keep an eye on future expansion, it is worth making a small structure. Update `src/msg.rs`:

<CodeBlock title="src/msg.rs">
    ```diff-rust
      use cosmwasm_schema::cw_serde;
    - use cosmwasm_std::Empty;
    + use cosmwasm_std::{Addr, Empty};
      use cw721::msg::{Cw721ExecuteMsg, Cw721QueryMsg};

      #[cw_serde]
      pub struct InstantiateMsg {
    +     pub payment_params: PaymentParams,
      }

    + #[cw_serde]
    + pub struct PaymentParams {
    +     pub beneficiary: Addr,
    + }
    +
      pub type CollectionExecuteMsg = Cw721ExecuteMsg<Option<Empty>, Option<Empty>, Empty>;
      ...
    ```
</CodeBlock>

And define its storage location. Create a new `src/state.rs` with a single stored item in it:

<CodeBlock title="src/state.rs">
    ```rust
    use cw_storage_plus::Item;

    use crate::msg::PaymentParams;

    pub const PAYMENT_PARAMS: Item<PaymentParams> = Item::new("payment_params");
    ```
</CodeBlock>

Then tie it back into the library:

<CodeBlock title="src/lib.rs">
    ```diff-rust
      pub mod contract;
      mod error;
      pub mod msg;
    + mod state;
    ```
</CodeBlock>

And of course, update your `instantiate` method to use it:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      use crate::{
          ...
          state::PAYMENT_PARAMS,
      }
      ...
      pub fn instantiate(
    -     _deps_: DepsMut,
    +     deps: DepsMut,
          _: Env,
          _: MessageInfo,
          msg: InstantiateMsg,
      ) -> ContractResult {
    +     PAYMENT_PARAMS.save(deps.storage, &msg.payment_params)?;
          Ok(Response::default())
      }
    ```
</CodeBlock>

## Forward funds in `execute`

With the straightforward stuff taken care of, it is time to properly handle fund forwarding in the `execute` method:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      use cosmwasm_std::{
    -     from_json, to_json_binary, CosmosMsg, DepsMut, Empty, Env, Event, MessageInfo, QueryRequest,
    -     Reply, ReplyOn, Response, StdError, SubMsg, WasmMsg, WasmQuery,
    +     from_json, to_json_binary, BankMsg, CosmosMsg, DepsMut, Empty, Env, Event, MessageInfo,
    +     QueryRequest, Reply, ReplyOn, Response, StdError, SubMsg, WasmMsg, WasmQuery,
      }
      ...
      fn execute_pass_through(
          ...
      ) -> ContractResult {
    +     let response = Response::default();
    +     let response = if !info.funds.is_empty() {
    +         let payment_params = PAYMENT_PARAMS.load(deps.storage)?;
    +         let forward_funds_msg = BankMsg::Send {
    +             to_address: payment_params.beneficiary.to_string(),
    +             amount: info.funds,
    +         };
    +         response.add_message(forward_funds_msg)
    +     } else {
    +         response
    +     };
          let onward_exec_msg = WasmMsg::Execute {
              contract_addr: collection.to_owned(),
              msg: to_json_binary(&message)?,
    -         funds: info.funds,
    +         funds: vec![],
          };
          ...
    -     Ok(Response::default()
    +     Ok(response
              .add_submessage(onward_sub_msg)
              .add_event(token_count_event))
      }
    ```
</CodeBlock>

Note how:

* The `WasmMsg::Execute` message now no longer forwards any funds to the NFT collection, but otherwise stays the same.
* It only loads the parameters from storage if there are funds to forward. This is to reduce unnecessary gas costs.
* Sending a [`BankMsg`](https://github.com/CosmWasm/cosmwasm/blob/v1.5.8/packages/std/src/results/cosmos_msg.rs#L56) is how you talk to the bank module.
* The `.add_message` takes an [`msg: impl Into<CosmosMsg<T>>`](https://github.com/CosmWasm/cosmwasm/blob/v1.5.8/packages/std/src/results/response.rs#L114).
* Thankfully, `CosmosMsg`'s [implements `From<BankMsg>`](https://github.com/CosmWasm/cosmwasm/blob/v1.5.8/packages/std/src/results/cosmos_msg.rs#L363-L367), so the `BankMsg` is converted into a[`CosmosMsg::Bank(BankMsg)`](https://github.com/CosmWasm/cosmwasm/blob/v1.5.8/packages/std/src/results/cosmos_msg.rs#L28).

## Update the unit tests

Now that there needs to be something in storage, it is better to call instantiate as part of the tests, and to update the expectations on the response:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      mod tests {
          use crate::{
              ...
              msg::{
    -             CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, NameServiceExecuteMsgResponse,
    +             CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, InstantiateMsg,
    +             NameServiceExecuteMsgResponse, msg::PaymentParams,
              },
          }
          use cosmwasm_std::{
              from_json,
              testing::{self, MockApi, MockQuerier, MockStorage},
    -         to_json_binary, Addr, Binary, Coin, ContractResult, CosmosMsg, Empty, Event, OwnedDeps,
    -         Querier, QuerierResult, QueryRequest, Reply, ReplyOn, Response, SubMsg, SubMsgResponse,
    -         SubMsgResult, SystemError, SystemResult, Uint128, WasmMsg, WasmQuery,
    +         to_json_binary, Addr, BankMsg, Binary, Coin, ContractResult, CosmosMsg, Empty, Event,
    +         OwnedDeps, Querier, QuerierResult, QueryRequest, Reply, ReplyOn, Response, SubMsg,
    +         SubMsgResponse, SubMsgResult, SystemError, SystemResult, Uint128, WasmMsg, WasmQuery,
          }
          ...
          fn test_pass_through() {
              ...
              let mocked_env = testing::mock_env();
    +         let deployer = Addr::unchecked("deployer");
    +             let mocked_msg_info = testing::mock_info(deployer.as_ref(), &[]);
    +             let instantiate_msg = InstantiateMsg {
    +                 payment_params: PaymentParams { beneficiary: deployer.to_owned() },
    +             };
    +             let _ = super::instantiate(
    +                 mocked_deps_mut.as_mut(),
    +                 mocked_env.to_owned(),
    +                 mocked_msg_info,
    +                 instantiate_msg,
    +             )
    +             .expect("Failed to instantiate manager");
              let executer = Addr::unchecked("executer");
              ...
              let expected_response = Response::default()
    +             .add_message(BankMsg::Send {
    +                 to_address: executer.to_string(),
    +                 amount: vec![fund_sent],
    +             })
                  .add_submessage(SubMsg {
                      ...
                      msg: CosmosMsg::<Empty>::Wasm(WasmMsg::Execute {
                          ...
    -                     funds: vec![fund_sent],
    +                     funds: vec![],
                      }),
                  })
              ...
          }
      }
    ```
</CodeBlock>

Note that:

* You removed the funds expectation on the `WasmMsg::Execute` message.

## Update the mocked-app tests

Your current test with the mocked app does not send coins along with the mint call. And indeed, the mocked addresses you use have no balances of their own to send from. Before you make some serious changes with balances, you can update your test that does not handle coins. Other than modifying the way you instantiate your collection manager, there is no change in the rest of the test.

<CodeBlock title="tests/contract.rs">
    ```diff-rust
    - use cosmwasm_std::{to_json_binary, Addr, Empty, Event};
    + use cosmwasm_std::{to_json_binary, Addr, Coin, Empty, Event, Uint128};
      use cw721::msg::{Cw721ExecuteMsg, Cw721QueryMsg, OwnerOfResponse};
    - use cw_multi_test::{App, ContractWrapper, Executor};
    + use cw_multi_test::{App, AppBuilder, ContractWrapper, Executor};
      use cw_my_collection_manager::{
          contract::{execute, instantiate, reply},
    -     msg::{ExecuteMsg, InstantiateMsg},
    +     msg::{ExecuteMsg, InstantiateMsg, PaymentParams},
      };
      ...
      fn instantiate_collection_manager(
          mock_app: &mut App,
    +     payment_params: PaymentParams,
      ) -> (u64, Addr) {
          ...
              return (
                  manager_code_id,
                  mock_app
                      .instantiate_contract(
                          manager_code_id,
                          Addr::unchecked("deployer-manager"),
    -                     &InstantiateMsg {},
    +                     &InstantiateMsg { payment_params },
                          &[],
                          "my-collection-manager",
                          None,
                      )
                      .expect("Failed to instantiate collection manager"),
              );
      }
      ...
      fn test_mint_through() {
          // Arrange
          let mut mock_app = App::default();
    +     let beneficiary_addr = Addr::unchecked("beneficiary");
          let (_, addr_manager) = instantiate_collection_manager(
              &mut mock_app,
    +         PaymentParams {
    +             beneficiary: beneficiary_addr.to_owned(),
    +         },
          );
          ...
      }
      ...
      fn test_mint_num_tokens() {
          // Arrange
          let mut mock_app = App::default();
    +     let beneficiary_addr = Addr::unchecked("beneficiary");
          let (_, addr_manager) = instantiate_collection_manager(
              &mut mock_app,
    +         PaymentParams {
    +             beneficiary: beneficiary_addr.to_owned(),
    +         },
          );
          ...
      }
    ```
</CodeBlock>

Note that:

* Only the instantiation changes.
* It includes imports used below here.

## Add a mocked app test with tokens

Let's make it interesting and have the sender send tokens along with the pass-through mint transaction. To be able to send tokens with the mocked app, you have to set some balances when mocking. That's where the [`AppBuilder`](https://github.com/CosmWasm/cw-multi-test/blob/v1.2.0/src/app_builder.rs) comes in.

<CodeBlock title="tests/contract.rs">
    ```rust
    #[test]
    fn test_paid_mint_through() {
        // Arrange
        let sender_addr = Addr::unchecked("sender");
        let extra_fund_sent = Coin {
            denom: "gold".to_owned(),
            amount: Uint128::from(335u128),
        };
        let mut mock_app = AppBuilder::default().build(|router, _api, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &sender_addr,
                    vec![extra_fund_sent.to_owned()],
                )
                .expect("Failed to init bank balances");
        });
        let beneficiary = Addr::unchecked("beneficiary");
        let (_, addr_manager) = instantiate_collection_manager(
            &mut mock_app,
            PaymentParams {
                beneficiary: beneficiary.to_owned(),
            },
        );
        let (_, addr_collection) = instantiate_nameservice(&mut mock_app, addr_manager.to_string());
        let owner_addr = Addr::unchecked("owner");
        let name_alice = "alice".to_owned();
        let register_msg = ExecuteMsg::PassThrough {
            collection: addr_collection.to_string(),
            message: CollectionExecuteMsg::Mint {
                token_id: name_alice.clone(),
                owner: owner_addr.to_string(),
                token_uri: None,
                extension: None,
            },
        };

        // Act
        let result = mock_app.execute_contract(
            sender_addr.clone(),
            addr_manager.clone(),
            &register_msg,
            &[extra_fund_sent.to_owned()],
        );

        // Assert
        assert!(result.is_ok(), "Failed to pass through the message");
        let result = result.unwrap();
        let expected_beneficiary_bank_event = Event::new("transfer")
            .add_attribute("recipient", "beneficiary")
            .add_attribute("sender", "contract0")
            .add_attribute("amount", "335gold");
        result.assert_event(&expected_beneficiary_bank_event);
        assert_eq!(
            Vec::<Coin>::new(),
            mock_app
                .wrap()
                .query_all_balances(sender_addr)
                .expect("Failed to get sender balances")
        );
        assert_eq!(
            vec![extra_fund_sent],
            mock_app
                .wrap()
                .query_all_balances(beneficiary)
                .expect("Failed to get beneficiary balances")
        );
        assert_eq!(
            Vec::<Coin>::new(),
            mock_app
                .wrap()
                .query_all_balances(addr_manager)
                .expect("Failed to get manager balances")
        );
        assert_eq!(
            Vec::<Coin>::new(),
            mock_app
                .wrap()
                .query_all_balances(addr_collection)
                .expect("Failed to get collection balances")
        );
    }
    ```
</CodeBlock>

Note that:

* It is inside the [`build` function](https://github.com/CosmWasm/cw-multi-test/blob/v1.2.0/src/app_builder.rs#L536) that you access the `storage` element necessary to call up the mocked balances feature.
* The sender is only credicted with `extra_fund_sent` so it has no remaining balance, which is asserted too.
* Only the bank message triggered an event, unlike the funds forwarded by the CosmWasm module when using the `funds` feature.
* Checking the balances of the smart contracts is just here as a belt-and-braces idea because that's akin to verifying the mocked app has correctly implemented the conservation of funds.

## Conclusion

You smart contract now sends a message across the CosmWasm module barrier and into a Cosmos module, the bank. It does so by forwarding all funds received. This is a rudimentary way of handling funds. In particular, for a collection manager that plans on eventually being a marketplace.

<HighlightBox type="info" title="Exercise progression">

At this stage:

* The `my-nameservice` project should still have something similar to the [`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch.
* The `my-collection-manager` project should have something similar to the [`cross-module-message`](https://github.com/b9lab/cw-my-collection-manager/tree/cross-module-message) branch, with [this](https://github.com/b9lab/cw-my-collection-manager/compare/reply-from-execute..cross-module-message) as the diff.

</HighlightBox>

In the next section, you have your collection manager smart contract handle funds more elaborately.
