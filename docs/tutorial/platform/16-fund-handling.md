---
title: Proper Funds Handling
description: Expect a payment, and return the change.
---

# Proper Funds Handling

Your _collection manager_ smart contract can forward all funds it receives to a beneficiary. That's a good way to avoid stranding funds on its balance, but this is level 1 of handling payments.

<HighlightBox type="info" title="Exercise progression">

If you skipped the previous section, you can just switch:

* The `my-nameservice` project to its [`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch.
* The `my-collection-manager` project to its [`cross-module-message`](https://github.com/b9lab/cw-my-collection-manager/tree/cross-module-message) branch.

And take it from there.

</HighlightBox>

## The use-case

As a first step towards being a market place, you modify your collection manager contract such that it expects a fixed payment for minting a new name. It will also send the payment, and nothing more, to the beneficiary. All extra funds will be sent back to the sender, in effect, returning the _change_. The contract will keep its balance to zero. To increase compatibility, the smart contract is configured to make the payment optional, in which case it returns all funds to the sender.

## New elements

The expected payment is defined as a `Coin`, and since it is optional, you wrap it into an `Option`:

<CodeBlock title="src/msg.rs">
    ```diff-rust
      use cosmwasm_schema::cw_serde;
    - use cosmwasm_std::{Addr, Empty};
    + use cosmwasm_std::{Addr, Coin, Empty};
      use cw721::msg::{Cw721ExecuteMsg, Cw721QueryMsg};
      ...
      #[cw_serde]
      pub struct PaymentParams {
          pub beneficiary: Addr,
    +     pub mint_price: Option<Coin>,
      }
      ...
    ```
</CodeBlock>

There will be an expected payment, so this introduces a new kind of possible user error:

<CodeBlock title="src/error.rs">
    ```diff-rust
    - use cosmwasm_std::{StdErr};
    + use cosmwasm_std::{Coin, StdError};
      use thiserror::Error;
      ...
      pub enum ContractError {
          #[error("{0}")]
          Std(#[from] StdError),
    +     #[error("price cannot be zero")]
    +     ZeroPrice,
    +     #[error("missing payment {:?}", missing_payment)]
    +     MissingPayment { missing_payment: Coin },
      }
      ...
    ```
</CodeBlock>

As evidenced here, you will also reject zero-valued prices, as this should be covered by `None` with less storage space used. You can encapsulate this information back in `src/msg.rs`:

<CodeBlock title="src/msg.rs">
    ```diff-rust
      use cosmwasm_schema::cw_serde;
    - use cosmwasm_std::{Addr, Coin, Empty};
    + use cosmwasm_std::{Addr, Coin, Empty, Uint128};
      use cw721::msg::{Cw721ExecuteMsg, Cw721QueryMsg};
    +
    + use crate::error::ContractError;
      ...
      #[cw_serde]
      pub struct PaymentParams {
          ...
      }

    + impl PaymentParams {
    +     pub fn validate(&self) -> Result<(), ContractError> {
    +         match &self.mint_price {
    +             Some(coin) if coin.amount.le(&Uint128::zero()) => Err(ContractError::ZeroPrice),
    +             None | Some(_) => Ok(()),
    +         }
    +     }
    + }
      ...
    ```
</CodeBlock>

## Update `instantiate`

The `instantiate` function can already handle the modified `PaymentParams`, but it would be nice that it does not allow a price of `0`, as conceptually, this is already covered by the `Option` part:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      use cosmwasm_std::{
    -     from_json, to_json_binary, BankMsg, CosmosMsg, DepsMut, Empty, Env, Event, MessageInfo,
    -     QueryRequest, Reply, ReplyOn, Response, StdError, SubMsg, WasmMsg, WasmQuery,
    +     from_json, to_json_binary, BankMsg, Coin, CosmosMsg, DepsMut, Empty, Env, Event, MessageInfo,
    +     QueryRequest, Reply, ReplyOn, Response, StdError, SubMsg, Uint128, WasmMsg, WasmQuery,
      };
      ...
      pub fn instantiate(deps: DepsMut, _: Env, _: MessageInfo, msg: InstantiateMsg) -> ContractResult {
    +     msg.payment_params.validate()?;
          PAYMENT_PARAMS.save(deps.storage, &msg.payment_params)?;
          Ok(Response::default())
      }
      ...
    ```
</CodeBlock>

## Update `execute`

Now comes the meat of fund handling. When in `execute`, your smart contract receives a [`MessageInfo`](https://github.com/CosmWasm/cosmwasm/blob/v1.5.8/packages/std/src/types.rs#L91-L106) with a `funds: Vec<Coin>` field that indicates what tokens have been sent as part of the message. The funds have been made available to your smart contract, with an assurance provided by the CosmWasm module. This is an assurance akin to that of `msg.value` in Ethereum's Solidity.

A small difficulty in our use-case is that CosmWasm populates `funds` as it is instructed by the maker of the message. In particular, if you send a message from the command like so:

```sh
wasmd tx wasm execute --amount 30silver,30silver ...
```

The `funds` field will contain two identical elements `30 silver` `Coin` objects, as it does not do any `Coin` aggregation. If your smart contract expects to be paid `55 silver`, two `Coin` objecs of `30 silver` each ought to be valid payment. So the `execute` function needs to:

1. Identify a valid payment possibly spread through multiple `Coin` objects.
2. Pay the beneficiary the agreed amount.
3. Calculate the change to return.
4. Return the change and unrelated `Coin`s back to the sender.

### An aggregating function

Start by adding in `src/contract.rs` a function that aggregates the coins for a denom of interest:

<CodeBlock title="src/contract.rs">
    ```rust
    fn split_fund_denom(denom: &String, funds: &[Coin]) -> (Uint128, Vec<Coin>) {
        let (amount, others) = funds.iter().fold(
            (Uint128::zero(), Vec::with_capacity(funds.len())),
            |(aggregated, mut others), fund| {
                if &fund.denom == denom {
                    (aggregated.strict_add(fund.amount), others)
                } else {
                    others.push(fund.clone());
                    (aggregated, others)
                }
            },
        );
        (amount, others)
    }
    ```
</CodeBlock>

Note that:

* The goal is to give it the minting price denom.
* Then it returns an aggregated `Coin` for the denom, and collects the other denominated coins in a vector without any aggregation.
* The `fold` function of an iterator takes an initial value, which here is a tuple with:
  * The value `0` to aggregate all coins of the given denom.
  * An empty coin list to collect coins of other denoms.
* This function does not deal about returning change of the denom, since it does not know the price.
* The `clone()` call takes place on the `fund`, not `funds`. This could make it more gas efficient.

### Fund handling only for minting

With the aggregation done, it is possible to create a function that returns the relevant bank messages to add to the response, with the assumption that this is only for when a minting is taking place:

<CodeBlock title="src/contract.rs">
    ```rust
    fn handle_pre_mint_funds(
        deps: &DepsMut,
        info: &MessageInfo,
    ) -> Result<Vec<BankMsg>, ContractError> {
        let payment_params = PAYMENT_PARAMS.load(deps.storage)?;
        let (payment, change) = match payment_params.mint_price {
            None => (None, info.funds.to_owned()),
            Some(minting_price) if minting_price.amount.le(&Uint128::zero()) => {
                Err(ContractError::ZeroPrice)?
            }
            Some(minting_price) => {
                let (aggregated, mut others) = split_fund_denom(&minting_price.denom, &info.funds);
                match aggregated.checked_sub(minting_price.amount) {
                    Err(_) => Err(ContractError::MissingPayment {
                        missing_payment: minting_price.to_owned(),
                    })?,
                    Ok(change_in_denom) if change_in_denom.le(&Uint128::zero()) => {}
                    Ok(change_in_denom) => others.push(Coin {
                        denom: minting_price.denom.clone(),
                        amount: change_in_denom,
                    }),
                };
                (Some(minting_price), others)
            }
        };
        let mut bank_msgs = Vec::<BankMsg>::new();
        if let Some(paid) = payment {
            bank_msgs.push(BankMsg::Send {
                to_address: payment_params.beneficiary.to_string(),
                amount: vec![paid],
            });
        }
        if !change.is_empty() {
            bank_msgs.push(BankMsg::Send {
                to_address: info.sender.to_string(),
                amount: change,
            })
        };
        Ok(bank_msgs)
    }
    ```
</CodeBlock>

Note that:

* It avoids adding any bank messages where the amount is `0` as this can trigger errors, depending on the implementation of the bank module.
* It also avoids setting an empty list of `Coin`s to the bank message.
* Even if there is no minting price, it has to handle returning all the funds to the sender.
* It also triggers an error in case of a `0` price. This case should not happen if the smart contract was instantiated correctly. This is using a composed `match` branch:

    ```rust
    Some(minting_price) if minting_price.amount.le(&Uint128::zero()) =>
    ```

* With the use of `Uint128::checked_sub`, you can elegantly handle the case where not enough was paid and preparing the message. Here too it uses a composed `match` branch;

    ```rust
    Ok(change_in_denom) if change_in_denom.le(&Uint128::zero()) =>
    ```

### Update `execute` proper

With these functions prepared, you can now go back to the main function and:

* Introduce the case when it is a mint and use the messages that have been prepared.
* Otherwise keep the hard refund.

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      fn execute_pass_through(
          ...
      ) -> ContractResult {
          let response = Response::default();
    -     let response = if !info.funds.is_empty() {
    -         let payment_params = PAYMENT_PARAMS.load(deps.storage)?;
    -         let forward_funds_msg = BankMsg::Send {
    -             to_address: payment_params.beneficiary.to_string(),
    -             amount: info.funds,
    -         };
    -         response.add_message(forward_funds_msg)
    -     } else {
    -         response
    +     let response = match message {
    +         CollectionExecuteMsg::Mint { .. } => match handle_pre_mint_funds(&deps, &info) {
    +             Err(err) => Err(err)?,
    +             Ok(bank_msgs) => response.add_messages(bank_msgs),
    +         },
    +         _ => {
    +             if !info.funds.is_empty() {
    +                 let refund_msg = BankMsg::Send {
    +                     to_address: info.sender.to_string(),
    +                     amount: info.funds,
    +                 };
    +                 response.add_message(refund_msg)
    +             } else {
    +                 response
    +             }
    +         }
          };
        ...
      }
    ```
</CodeBlock>

Note how:

* It only calls the new fund handling function in case of a mint message, and returns everything to sender otherwise.

## Unit tests

You are going to update the existing unit tests and add one that checks the proper handling of funds on mint.

### Update unit test

There is not much to do here. You can decide that minting is free, and test that all funds are returned:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      mod tests {
          ...
          fn test_pass_through() {
              ...
              let instantiate_msg = InstantiateMsg {
                  payment_params: PaymentParams {
                      beneficiary: deployer.to_owned(),
    +                 mint_price: None,
                  },
              };
              ...
              let expected_response = Response::default()
                  .add_message(BankMsg::Send {
    -                 to_address: deployer.to_string(),
    +                 to_address: executer.to_string(),
                      amount: vec![fund_sent],
                  })
              ...
          }
          ...
      }
    ```
</CodeBlock>

Note that it is just confirming that, absent a minting price, the funds are no longer sent to the beneficiary but returned to the sender.

### Add one with complex funds

To make things more interesting you create a new unit test where:

* You set a minting price of `55 silver`.
* Send a mint command with two funds of `30 silver` each, ensuring it is a valid payment that expects some change.
* Also send an unnecessary fund of `335 gold`.

With this, you expect the beneficiary to receive `55 silver`, and the sender to be returned `5 silver` and `335 gold`. Let's add this brand new test function:

<CodeBlock title="src/contract.rs">
    ```rust
    #[test]
    fn test_paid_mint_pass_through() {
        // Arrange
        let mut mocked_deps_mut = mock_deps(NumTokensResponse { count: 3 });
        let mocked_env = testing::mock_env();
        let beneficiary = Addr::unchecked("beneficiary");
        let deployer = Addr::unchecked("deployer");
        let mocked_msg_info = testing::mock_info(deployer.as_ref(), &[]);
        let minting_price = Coin {
            amount: Uint128::from(55u16),
            denom: "silver".to_owned(),
        };
        let instantiate_msg = InstantiateMsg {
            payment_params: PaymentParams {
                beneficiary: beneficiary.to_owned(),
                mint_price: Some(minting_price.to_owned()),
            },
        };
        let _ = super::instantiate(
            mocked_deps_mut.as_mut(),
            mocked_env.to_owned(),
            mocked_msg_info,
            instantiate_msg,
        )
        .expect("Failed to instantiate manager");
        let executer = Addr::unchecked("executer");
        let extra_fund_sent = Coin {
            denom: "gold".to_owned(),
            amount: Uint128::from(335u128),
        };
        let fistful_silver = Coin {
            amount: Uint128::from(30u16),
            denom: "silver".to_owned(),
        };
        let mocked_msg_info = testing::mock_info(
            executer.as_ref(),
            &[
                extra_fund_sent.to_owned(),
                fistful_silver.to_owned(),
                fistful_silver,
            ],
        );
        let name = "alice".to_owned();
        let owner = Addr::unchecked("owner");
        let inner_msg = CollectionExecuteMsg::Mint {
            token_id: name.to_owned(),
            owner: owner.to_string(),
            token_uri: None,
            extension: None,
        };
        let execute_msg = ExecuteMsg::PassThrough {
            collection: "collection".to_owned(),
            message: inner_msg.to_owned(),
        };

        // Act
        let contract_result = super::execute(
            mocked_deps_mut.as_mut(),
            mocked_env,
            mocked_msg_info.to_owned(),
            execute_msg,
        );

        // Assert
        assert!(contract_result.is_ok(), "Failed to pass message through");
        let received_response = contract_result.unwrap();
        let expected_denom_change = Coin {
            amount: Uint128::from(5u16),
            denom: "silver".to_owned(),
        };
        let expected_response = Response::default()
            .add_message(BankMsg::Send {
                to_address: beneficiary.to_string(),
                amount: vec![minting_price],
            })
            .add_message(BankMsg::Send {
                to_address: mocked_msg_info.sender.to_string(),
                amount: vec![extra_fund_sent, expected_denom_change],
            })
            .add_submessage(SubMsg {
                id: ReplyCode::PassThrough as u64,
                msg: CosmosMsg::<Empty>::Wasm(WasmMsg::Execute {
                    contract_addr: "collection".to_owned(),
                    msg: to_json_binary(&inner_msg).expect("Failed to serialize inner message"),
                    funds: vec![],
                }),
                reply_on: ReplyOn::Success,
                gas_limit: None,
            })
            .add_event(
                Event::new("my-collection-manager").add_attribute("token-count-before", "3"),
            );
        assert_eq!(received_response, expected_response);
    }
    ```
</CodeBlock>

Note that:

* Most of the space is taken building the funds and asserting them.

## Mocked app tests

Here you only need to make some updates. First on the functions that test without a minting price:

<CodeBlock title="tests/contract.rs">
    ```diff-rust
      ...
      fn test_mint_through() {
          ...
          let (_, addr_manager) = instantiate_collection_manager(
              &mut mock_app,
              PaymentParams {
                  beneficiary: beneficiary_addr.to_owned(),
    +             mint_price: None,
              },
          );
          ...
      }
      ...
      fn test_mint_num_tokens() {
          ...
          let (_, addr_manager) = instantiate_collection_manager(
              &mut mock_app,
              PaymentParams {
                  beneficiary: beneficiary_addr.to_owned(),
    +             mint_price: None,
              },
          );
          ...
      }
    ```
</CodeBlock>

Not much to show here.

Then for the more interesting one:

* You set a minting price of `55 silver`.
* Send a mint command with two funds of `30 silver` each, ensuring it is a valid payment that expects some change.
* Also send an unnecessary fund of `335 gold`.

With this, you expect the beneficiary to receive `55 silver`, and the sender to be returned `5 silver` and `335 gold`. But for all this to happen, the sender needs to start with `60 silver` and `335 gold` at least at _genesis_.

Let's adjust:

<CodeBlock title="tests/contract.rs">
    ```diff-rust
      ...
      fn test_paid_mint_through() {
          // Arrange
          let sender_addr = Addr::unchecked("sender");
    +     let minting_price = Coin {
    +         amount: Uint128::from(55u16),
    +         denom: "silver".to_owned(),
    +     };
          ...
          let mut mock_app = AppBuilder::default().build(|router, _api, storage| {
    +         let original_silver = Coin {
    +             amount: Uint128::from(60u16),
    +             denom: "silver".to_owned(),
    +         };
              router
                  ...
                  .init_balance(
                      ...
    -                 vec![extra_fund_sent.to_owned()],
    +                 vec![extra_fund_sent.to_owned(), original_silver],
                  )
                  ...
          });
          ...
          let (_, addr_manager) = instantiate_collection_manager(
              &mut mock_app,
              PaymentParams {
                  beneficiary: beneficiary.to_owned(),
    +             mint_price: Some(minting_price.to_owned()),
              },
          );
          ...
          let register_msg = ExecuteMsg::PassThrough {
              ...
          };
    +     let half_silver = Coin {
    +         amount: Uint128::from(30u16),
    +         denom: "silver".to_owned(),
    +     };
          ...
          let result = mock_app.execute_contract(
              sender_addr.clone(),
              addr_manager.clone(),
              &register_msg,
              &[
                  extra_fund_sent.to_owned(),
    +             half_silver.to_owned(),
    +             half_silver,
              ],
          );
          ...
          let expected_beneficiary_bank_event = Event::new("transfer")
              ...
    -         .add_attribute("amount", "335gold");
    +         .add_attribute("amount", "55silver");
          result.assert_event(&expected_beneficiary_bank_event);
    +     let expected_sender_bank_event = Event::new("transfer")
    +         .add_attribute("recipient", "sender")
    +         .add_attribute("sender", "contract0")
    +         .add_attribute("amount", "335gold,5silver");
    +     result.assert_event(&expected_sender_bank_event);
    +     let expected_silver_change = Coin {
    +         amount: Uint128::from(5u16),
    +         denom: "silver".to_owned(),
    +     };
          assert_eq!(
    -         Vec::<Coin>::new(),
    +         vec![extra_fund_sent, expected_silver_change],
              mock_app
                  .wrap()
                  .query_all_balances(sender_addr)
                  .expect("Failed to get sender balances")
          );
          assert_eq!(
    -         vec![extra_fund_sent],
    +         vec![minting_price],
              mock_app
                  .wrap()
                  .query_all_balances(beneficiary)
                  .expect("Failed to get beneficiary balances")
          );
          ...
      }
      ...
    ```
</CodeBlock>

Note that:

* There was not too much to change as the test was already mostly set up.
* The main point is to correctly keep track of the monies.
* The beneficiary receives only the minting price as evidenced by the event and the balance.
* The bank event's `amount` attribute concatenates the different coins in this manner: `"335gold,5silver"`.

## Conclusion

Your smart contract is now able to manipulate funds received in a manner consistent with an expected payment, and to send messages to the bank to make token transfers.

You could add tests that test the new private functions in isolation, or that funds are returned for non-mint operations. This is left as an exercise.

<HighlightBox type="info" title="Exercise progression">

At this stage:

* The `my-nameservice` project should still have something similar to the [`execute-return-data`](https://github.com/b9lab/cw-my-nameservice/tree/execute-return-data) branch.
* The `my-collection-manager` project should have something similar to the [`proper-fund-handling`](https://github.com/b9lab/cw-my-collection-manager/tree/proper-fund-handling) branch, with [this](https://github.com/b9lab/cw-my-collection-manager/compare/cross-module-message..proper-fund-handling) as the diff.

</HighlightBox>
