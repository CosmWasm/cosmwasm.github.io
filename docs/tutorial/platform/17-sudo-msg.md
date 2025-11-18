---
title: First Sudo Message
description: The Cosmos way to manage your smart contract.
---

# First Sudo Message

Your _collection manager_ smart contract can now impose a payment when minting a new name.

<HighlightBox type="info" title="Exercise progression">

If you skipped the previous section, you can just switch:

* The `my-nameservice` project to its [`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch.
* The `my-collection-manager` project to its [`proper-fund-handling`](https://github.com/b9lab/cw-my-collection-manager/tree/proper-fund-handling) branch.

And take it from there.

</HighlightBox>

What if you want to change the price or the beneficiary? You could add a new `ExecuteMsg` variant, and gateway it with some parameters. Perhaps you may want to have a vote on it. All this sounds a lot like a governance proposal as it can be implemented on a Cosmos app-chain. What if you could create a governance proposal whose execution is deterministically executed by your smart contract?

That's one of the purposes of **sudo** messages. A sudo message is one that comes from the underlying app-chain. This is not a user-generated message coming with a transaction.

## The mechanism

When running `wasmd` or your own app chain you can launch a governance proposal by using the command:

    ```sh
    wasmd tx gov submit-proposal sudo-contract --help
    ```

This creates a [`MsgSudoContract`](https://github.com/CosmWasm/wasmd/blob/v0.53.0/proto/cosmwasm/wasm/v1/tx.proto#L314-L328) that very much looks like [`WasmSudo`](https://github.com/CosmWasm/cw-multi-test/blob/v1.2.0/src/wasm.rs#L45-L53) that you use in the mocked app tests below.

When the proposal is voted in, your smart contract gets called with the `bytes msg` part.

## The use-case

You implement a sudo message that lets the app-chain change the payment parameters.

## Add the payment params query

As it is going to be useful, add a query to get the current payment parameters. In a previous section, you saw in detail how to do that, so here we add them without much explanations:

<CodeBlock title="src/msg.rs">
    ```diff-rust
    - use cosmwasm_schema::cw_serde;
    + use cosmwasm_schema::{cw_serde, QueryResponses};
      use cosmwasm_std::{Addr, Coin, Empty, Uint128};
      ...
      pub struct NameServiceExecuteMsgResponse {
          pub num_tokens: u64,
      }
    +
    + #[cw_serde]
    + #[derive(QueryResponses)]
    + pub enum QueryMsg {
    +     #[returns(GetPaymentParamsResponse)]
    +     GetPaymentParams,
    + }
    +
    + #[cw_serde]
    + pub struct GetPaymentParamsResponse {
    +     pub payment_params: PaymentParams,
    + }
    ```
</CodeBlock>

<CodeBlock title="src/contract.rs">
    ```diff-rust
      use crate::{
          error::ContractError,
          msg::{
    -         CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, InstantiateMsg,
    -         NameServiceExecuteMsgResponse,
    +         CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, GetPaymentParamsResponse,
    +         InstantiateMsg, NameServiceExecuteMsgResponse, QueryMsg,
          },
          state::PAYMENT_PARAMS,
      };
      ...
      use cosmwasm_std::{
    -     from_json, to_json_binary, BankMsg, Coin, CosmosMsg, DepsMut, Empty, Env, Event, MessageInfo,
    -     QueryRequest, Reply, ReplyOn, Response, StdError, SubMsg, Uint128, WasmMsg, WasmQuery,
    +     from_json, to_json_binary, BankMsg, Coin, CosmosMsg, Deps, DepsMut, Empty, Env, Event,
    +     MessageInfo, QueryRequest, QueryResponse, Reply, ReplyOn, Response, StdError, SubMsg, Uint128,
    +     WasmMsg, WasmQuery,
      };
      ...
      fn reply_pass_through(...) -> ContractResult {
          ...
      }

    + #[cfg_attr(not(feature = "library"), entry_point)]
    + pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> Result<QueryResponse, ContractError> {
    +     match msg {
    +         QueryMsg::GetPaymentParams {} => Ok(to_json_binary(&GetPaymentParamsResponse {
    +             payment_params: PAYMENT_PARAMS.load(deps.storage)?,
    +         })?),
    +     }
    + }
      ...
    ```
</CodeBlock>

Take this opportunity to replace your dummy query lambda, used in the mocked app test, with the real function:

<CodeBlock title="test/contract.rs">
    ```diff-rust
    - use cosmwasm_std::{to_json_binary, Addr, Coin, Empty, Event, Uint128};
    + use cosmwasm_std::{Addr, Coin, Empty, Event, Uint128};
      ...
      use cw_my_collection_manager::{
    -     contract::{execute, instantiate, reply},
    +     contract::{execute, instantiate, query, reply},
          msg::{ExecuteMsg, InstantiateMsg, PaymentParams},
      };
      ...
      fn instantiate_collection_manager(
          ...
      ) -> (u64, Addr) {
    -     let code = Box::new(
    -         ContractWrapper::new(execute, instantiate, |_, _, _: ()| {
    -             to_json_binary("mocked_manager_query")
    -         })
    -         .with_reply(reply),
    -     );
    +     let code = Box::new(ContractWrapper::new(execute, instantiate, query).with_reply(reply));
          let manager_code_id = mock_app.store_code(code);
          ...
      }
      ...
    ```
</CodeBlock>

<HighlightBox type="info" title="Exercise progression">

At this intermediate stage the `my-collection-manager` project should have something similar to the [`payment-params-query`](https://github.com/b9lab/cw-my-collection-manager/tree/payment-params-query) branch, with [this](https://github.com/b9lab/cw-my-collection-manager/compare/proper-fund-handling..payment-params-query) as the diff.

</HighlightBox>

## The sudo message

You define your own sudo messages separately from the others. They are not a subset of, say, `ExecuteMsg`:

<CodeBlock title="src/msg.rs">
    ```diff-rust
      ...
      pub struct GetPaymentParamsResponse {
          pub payment_params: PaymentParams,
      }
    +
    +  #[cw_serde]
    +  pub enum SudoMsg {
    +      UpdatePaymentParams(PaymentParams),
    +  }
    ```
</CodeBlock>

## Sudo handling

To handle sudo messages, you need to add the `sudo` entry point. This is the one that the CosmWasm module will invoke when the system instructs it to handle a sudo message. Here too, the `sudo` function only matches the variant and then invokes a specialized sudo function:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      use crate::{
          msg::{
              CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, GetPaymentParamsResponse,
    -         InstantiateMsg, NameServiceExecuteMsgResponse, QueryMsg,
    +         InstantiateMsg, NameServiceExecuteMsgResponse, PaymentParams, QueryMsg, SudoMsg,
          },
      }
      ...
    + #[cfg_attr(not(feature = "library"), entry_point)]
    + pub fn sudo(deps: DepsMut, _env: Env, msg: SudoMsg) -> ContractResult {
    +     match msg {
    +         SudoMsg::UpdatePaymentParams(payment_params) => {
    +             sudo_update_payment_params(deps, payment_params)
    +         }
    +     }
    + }
    + 
    + fn sudo_update_payment_params(deps: DepsMut, payment_params: PaymentParams) -> ContractResult {
    +     payment_params.validate()?;
    +     PAYMENT_PARAMS.save(deps.storage, &payment_params)?;
    +     let sudo_event = Event::new("my-collection-manager");
    +     let sudo_event = append_payment_params_attributes(sudo_event, payment_params);
    +     Ok(Response::default().add_event(sudo_event))
    + }

    + fn append_payment_params_attributes(my_event: Event, payment_params: PaymentParams) -> Event {
    +     let my_event = my_event.add_attribute(
    +         "update-payment-params-beneficiary",
    +         payment_params.beneficiary,
    +     );
    +     match payment_params.mint_price {
    +         None => my_event.add_attribute("update-payment-params-mint-price", "none"),
    +         Some(mint_price) => my_event
    +             .add_attribute("update-payment-params-mint-price-denom", mint_price.denom)
    +             .add_attribute(
    +                 "update-payment-params-mint-price-amount",
    +                 mint_price.amount.to_string(),
    +             ),
    +     }
    + }

      #[cfg(test)]
      mod tests...
    ```
</CodeBlock>

Note that:

* Just as in instantiate, it verifies that the new parameters are valid.
* Just as in execute, it emits an event to inform on the change.
* The new function that appends values to the event can be reused.

## Adjust instantiate for good measure

Now that the payment parameters can change, and with a goal of symmetry, you can adjust the `instantiate` function to also emit an event. This has the added benefit that the history of the payment parameters value can be reconstructed from the events alone.

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ..
      #[cfg_attr(not(feature = "library"), entry_point)]
      pub fn instantiate(deps: DepsMut, _: Env, _: MessageInfo, msg: InstantiateMsg) -> ContractResult {
          msg.payment_params.validate()?;
          PAYMENT_PARAMS.save(deps.storage, &msg.payment_params)?;
    +     let instantiate_event = Event::new("my-collection-manager");
    +     let instantiate_event = append_payment_params_attributes(instantiate_event, msg.payment_params);
    -     Ok(Response::default())
    +     Ok(Response::default().add_event(instantiate_event))
      }
      ...
    ```
</CodeBlock>

## Unit tests

It is worth adding a unit test that calls the function in isolation and confirms it returns as expected.

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      mod tests {
          use crate::{
              contract::ReplyCode,
              msg::{
                  CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, InstantiateMsg,
    -             NameServiceExecuteMsgResponse, PaymentParams,
    +             NameServiceExecuteMsgResponse, PaymentParams, SudoMsg,
              },
    +         state::PAYMENT_PARAMS,
          };
          ...
          fn test_reply_pass_through() {
              ...
          }
    + 
    +     #[test]
    +     fn test_sudo_update_payment_params() {
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
    +         let sudo_msg = SudoMsg::UpdatePaymentParams(new_payment_params.to_owned());
    +
    +         // Act
    +         let contract_result = super::sudo(mocked_deps_mut.as_mut(), mocked_env, sudo_msg);
    +
    +         // Assert
    +         assert!(contract_result.is_ok(), "Failed to sudo");
    +         let received_response = contract_result.unwrap();
    +         let expected_response = Response::default().add_event(
    +             Event::new("my-collection-manager")
    +                 .add_attribute("update-payment-params-beneficiary", beneficiary)
    +                 .add_attribute("update-payment-params-mint-price-denom", "silver")
    +                 .add_attribute("update-payment-params-mint-price-amount", "1"),
    +         );
    +         assert_eq!(received_response, expected_response);
    +         let payment_params = PAYMENT_PARAMS
    +             .load(&mocked_deps_mut.storage)
    +             .expect("Failed to load payment params");
    +         assert_eq!(payment_params, new_payment_params);
    +     }
      }
    ```
</CodeBlock>

Note that:

* It is not strictly necessary to first call the instantiate as the test only writes to storage.

## Mocked app tests

You can instruct the mocked app to pass a sudo msg to your _compiled_ smart contract, as long as you compiled it with the `sudo` function.

<CodeBlock title="tests/contract.rs">
    ```diff-rust
      ...
      use cw721::msg::{Cw721ExecuteMsg, Cw721QueryMsg, OwnerOfResponse};
    - use cw_multi_test::{App, AppBuilder, ContractWrapper, Executor};
    + use cw_multi_test::{App, AppBuilder, ContractWrapper, Executor, WasmSudo};
      use cw_my_collection_manager::{
    -     contract::{execute, instantiate, query, reply},
    -     msg::{ExecuteMsg, InstantiateMsg, PaymentParams},
    +     contract::{execute, instantiate, query, reply, sudo},
    +     msg::{ExecuteMsg, GetPaymentParamsResponse, InstantiateMsg, PaymentParams, QueryMsg, SudoMsg},
      };
      ...
      fn instantiate_collection_manager(
          ...
      ) -> (u64, Addr) {
          let code = Box::new(
              ContractWrapper::new(execute, instantiate, query)
    -             .with_reply(reply),
    +             .with_reply(reply)
    +             .with_sudo(sudo),
          );
          ...
      }
      ...
    + #[test]
    + fn test_sudo_update_payment_params() {
    +     // Arrange
    +     let mut mock_app = App::default();
    +     let beneficiary_addr = Addr::unchecked("beneficiary");
    +     let (_, addr_manager) = instantiate_collection_manager(
    +         &mut mock_app,
    +         PaymentParams {
    +             beneficiary: beneficiary_addr.to_owned(),
    +             mint_price: None,
    +         },
    +     );
    +     let new_payment_params = PaymentParams {
    +         beneficiary: beneficiary_addr.to_owned(),
    +         mint_price: Some(Coin {
    +             denom: "silver".to_owned(),
    +             amount: Uint128::from(23u16),
    +         }),
    +     };
    +     let update_sudo_msg = SudoMsg::UpdatePaymentParams(new_payment_params.to_owned());
    +     let sudo_msg = cw_multi_test::SudoMsg::Wasm(
    +         WasmSudo::new(&addr_manager, &update_sudo_msg).expect("Failed to serialize sudo message"),
    +     );
    +
    +     // Act
    +     let result = mock_app.sudo(sudo_msg);
    +
    +     // Assert
    +     assert!(result.is_ok(), "Failed to pass through the message");
    +     let result = result.unwrap();
    +     let expected_sudo_event = Event::new("wasm-my-collection-manager")
    +         .add_attribute("_contract_address", addr_manager.to_owned())
    +         .add_attribute("update-payment-params-beneficiary", beneficiary_addr)
    +         .add_attribute("update-payment-params-mint-price-denom", "silver")
    +         .add_attribute("update-payment-params-mint-price-amount", "23");
    +     result.assert_event(&expected_sudo_event);
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
    ```
</CodeBlock>

Note that:

* Note that your smart contract's sudo message is first wrapped into the testing frameworks sudo message.
* The mocked app tests only test that the contract handles a sudo message coming from the app. It does not test that, given a properly formed governance proposal, the smart contract is called on sudo. Testing that would be like testing a mocked app feature.

## Conclusion

Now your smart contract is able to receive instructions from the underlying app chain to update the payment parameters. By leveraging the Cosmos SDK's governance module, you only have to code the effect of successful proposals.

<HighlightBox type="info" title="Exercise progression">

At this stage:

* The `my-nameservice` project should still have something similar to the [`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch.
* The `my-collection-manager` project should have something similar to the [`sudo-message`](https://github.com/b9lab/cw-my-collection-manager/tree/sudo-message) branch, with [this](https://github.com/b9lab/cw-my-collection-manager/compare/payment-params-query..sudo-message) as the diff from the payment params query and [this](https://github.com/b9lab/cw-my-collection-manager/compare/proper-fund-handling..sudo-message) as the larger diff from the previous section.

</HighlightBox>
