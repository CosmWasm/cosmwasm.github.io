---
title: First Contract Query Integration
description: Send a synchronous and read-only query from one smart contract to another.
---

# First Contract Query Integration

In the previous section you had your _collection manager_ smart contract send a message to your _name service_ smart contract so that the latter executes something. The _manager_ sends this message at the end of its own execution.

<HighlightBox type="info" title="Exercise progression">

If you skipped the previous section, you can just switch:

* The `my-nameservice` project to its [`add-nft-library`](https://github.com/b9lab/cw-my-nameservice/tree/add-nft-library) branch.
* The `my-collection-manager` project to its [`initial-pass-through`](https://github.com/b9lab/cw-my-collection-manager/tree/initial-pass-through) branch.

And take it from there.

</HighlightBox>

What if your collection manager wants to query a value from the collection in order to make a decision? It would need to make a synchronous query. This is possible. For that, your collection manager assembles a query message and sends it synchronously, with the certainty that it all happens in a read-only way.

## The use-case

The NFT library keeps track of how many tokens it has minted. It is possible to query this information with the use of [`QueryMsg::NumTokens`](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/packages/cw721/src/msg.rs#L191-L193). To demonstrate its use, your collection manager will emit an event about the current number of tokens before passing the message through.

## Update `execute`

It is a matter of preparing the `NumTokens` query and interpreting the result:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      use crate::{
          ...
    -     msg::{CollectionExecuteMsg, ExecuteMsg, InstantiateMsg},
    +     msg::{CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg, InstantiateMsg},
      }
      ...
      use cosmwasm_std::{
    -     to_json_binary, DepsMut, Env, MessageInfo, Response, WasmMsg,
    +     to_json_binary, DepsMut, Env, Event, MessageInfo, QueryRequest, Response, WasmMsg, WasmQuery,
      };
    + use cw721::msg::NumTokensResponse;
      ...

      fn execute_pass_through(
    -     _: DepsMut,
    +     deps: DepsMut,
          ...
      ) -> ContractResult {
          ...
    +     let token_count_result =
    +         deps.querier
    +             .query::<NumTokensResponse>(&QueryRequest::Wasm(WasmQuery::Smart {
    +                 contract_addr: collection,
    +                 msg: to_json_binary(&CollectionQueryMsg::NumTokens {})?,
    +             }));
    +     let token_count_event = Event::new("my-collection-manager")
    +         .add_attribute("token-count-before", token_count_result?.count.to_string());
          Ok(Response::default()
              .add_message(onward_exec_msg)
    +         .add_event(token_count_event))
          )
          ...
      }
    ```
</CodeBlock>

Note how:

* The `querier` gives read-only access.
* The preparing and sending very much looks like what you did with mocked-app tests of the query function.
* The event is `token-count-before` to make it clear that it takes place before any action, which may be a minting. Given the design of CosmWasm it is not possible to query after the message from within the `execute` function.

## Unit tests

Updating the unit test is arduous. Indeed, your default mocked dependencies created with `testing::mock_dependencies()` do not mock any values on your dummy collection. You have to prepare the mocks yourself.

### Add a mock querier

The following is inspired form the [work of Stargaze](https://github.com/public-awesome/names/blob/v2.2.0/contracts/sg721-name/src/unit_tests.rs#L22-L67). Add your own `MockQuerier` which returns predefined responses:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      mod tests {
    -     use crate::msg::{CollectionExecuteMsg, ExecuteMsg};
    +     use crate::msg::{CollectionExecuteMsg, CollectionQueryMsg, ExecuteMsg};
          use cosmwasm_std::{
    +         from_json,
    -         testing,
    +         testing::{self, MockApi, MockQuerier, MockStorage},
    -         to_json_binary, Addr, Coin, Response, Uint128, WasmMsg,
    +         to_json_binary, Addr, Coin, ContractResult, Empty, Event, OwnedDeps, Querier,
    +         QuerierResult, QueryRequest, Response, SystemError, SystemResult, Uint128, WasmMsg,
    +         WasmQuery,
          };
    +     use cw721::msg::NumTokensResponse;
    +     use std::marker::PhantomData;

    +     pub fn mock_deps(
    +         response: NumTokensResponse,
    +     ) -> OwnedDeps<MockStorage, MockApi, NumTokensMockQuerier, Empty> {
    +         OwnedDeps {
    +             storage: MockStorage::default(),
    +             api: MockApi::default(),
    +             querier: NumTokensMockQuerier::new(MockQuerier::new(&[]), response),
    +             custom_query_type: PhantomData,
    +         }
    +     }
    + 
    +     pub struct NumTokensMockQuerier {
    +         base: MockQuerier,
    +         response: NumTokensResponse,
    +     }
    + 
    +     impl Querier for NumTokensMockQuerier {
    +         fn raw_query(&self, bin_request: &[u8]) -> QuerierResult {
    +             match from_json(bin_request) {
    +                 Ok(request) => self.handle_query(&request),
    +                 Err(e) => SystemResult::Err(SystemError::InvalidRequest {
    +                     error: format!("Parsing query request: {}", e),
    +                     request: bin_request.into(),
    +                 }),
    +             }
    +         }
    +     }
    + 
    +     impl NumTokensMockQuerier {
    +         pub fn handle_query(&self, request: &QueryRequest<Empty>) -> QuerierResult {
    +             match request {
    +                 QueryRequest::Wasm(wasm_query) => match wasm_query {
    +                     WasmQuery::Smart {
    +                         contract_addr: _,
    +                         msg,
    +                     } => {
    +                         let serialized = from_json::<CollectionQueryMsg>(msg)
    +                             .map(|collection_query| match collection_query {
    +                                 CollectionQueryMsg::NumTokens {} => to_json_binary(&self.response)
    +                                     .expect("Failed to serialize num tokens response"),
    +                                 _ => unimplemented!("{:?}", collection_query),
    +                             })
    +                             .expect("Failed to find serialised type");
    +                         SystemResult::Ok(ContractResult::Ok(serialized))
    +                     }
    +                     _ => unimplemented!("{:?}", wasm_query),
    +                 },
    +                 _ => self.base.handle_query(request),
    +             }
    +         }
    + 
    +         pub fn new(base: MockQuerier<Empty>, response: NumTokensResponse) -> Self {
    +             NumTokensMockQuerier { base, response }
    +         }
    +     }
          ...
      }
    ```
</CodeBlock>

Note that:

* You define a brand new `MockQuerier`, one that fits your narrow purpose of returning one predefined response.
* Your `NumTokensMockQuerier` is a simple mock that returns the provided `NumTokensResponse`, without really verifying that it is called only once.
* The mock querier still fails if it receives a query other than `NumTokens`. If you wanted to handle more queries, you would have to adjust it.
* You also have to redefine the `mock_deps` function because its return value is strongly typed, and you need `OwnedDeps<MockStorage, MockApi, NumTokensMockQuerier, Empty>`.
* The content of `handle_query` is long but it is mostly about deserializing, picking and serializing.

### Update execute

With this, you need to call `mock_deps` with dummy response values `count: 3`, and then update the expected message with the expected event:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      mod tests {
          ...
          fn test_pass_through() {
              // Arrange
    -         let mut mocked_deps_mut = testing::mock_dependencies();
    +         let mut mocked_deps_mut = mock_deps(NumTokensResponse { count: 3 });
              ...
              let expected_response = Response::default()
                  .add_message(WasmMsg::Execute {
                      contract_addr: "collection".to_owned(),
                      msg: to_json_binary(&inner_msg).expect("Failed to serialize inner message"),
                      funds: vec![fund_sent],
    -             });
    +             })
    +             .add_event(
    +                 Event::new("my-collection-manager").add_attribute("token-count-before", "3"),
    +             );
              ...
          }
      }
    ```
</CodeBlock>

Note that:

* The difficult work was creating the mock querier.

## Mocked app tests

In these tests, you test the integration between the collection smart contract and the manager, so you do not even need to mock the querier, but instead rely on the mocked app to direct your query as expected.

### Update the existing test

<CodeBlock title="tests/contract.rs">
    ```diff-rust
      ...
      fn test_mint_through() {
          ...
          result.assert_event(&expected_cw721_event);
    +     let expected_manager_event =
    +         Event::new("wasm-my-collection-manager").add_attribute("token-count-before", "0");
    +     result.assert_event(&expected_manager_event);
          let owner_query = CollectionQueryMsg::OwnerOf
          ...
      }
    ```
</CodeBlock>

As expected, there are no tokens when you do your first _mint_.

### Add a more relevant test

To make the tests more meaningful, you also add a test for when two mint commands have been sent.

<CodeBlock title="tests/contract.rs">
    ```rust
    #[test]
    fn test_mint_num_tokens() {
        // Arrange
        let mut mock_app = App::default();
        let (_, addr_manager) = instantiate_collection_manager(&mut mock_app);
        let (_, addr_collection) = instantiate_nameservice(&mut mock_app, addr_manager.to_string());
        let owner_addr = Addr::unchecked("owner");
        let name_alice = "alice".to_owned();
        let name_bob = "bob".to_owned();
        let sender_addr = Addr::unchecked("sender");
        let register_msg = ExecuteMsg::PassThrough {
            collection: addr_collection.to_string(),
            message: CollectionExecuteMsg::Mint {
                token_id: name_alice.clone(),
                owner: owner_addr.to_string(),
                token_uri: None,
                extension: None,
            },
        };
        let _ = mock_app
            .execute_contract(
                sender_addr.clone(),
                addr_manager.clone(),
                &register_msg,
                &[],
            )
            .expect("Failed to pass through the first mint message");
        let register_msg = ExecuteMsg::PassThrough {
            collection: addr_collection.to_string(),
            message: CollectionExecuteMsg::Mint {
                token_id: name_bob.clone(),
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
            &[],
        );

        // Assert
        assert!(
            result.is_ok(),
            "Failed to pass through the second mint message"
        );
        let result = result.unwrap();
        let expected_cw721_event = Event::new("wasm")
            .add_attribute("_contract_address", addr_collection.to_string())
            .add_attribute("action", "mint")
            .add_attribute("token_id", name_bob.to_string())
            .add_attribute("owner", owner_addr.to_string());
        result.assert_event(&expected_cw721_event);
        let expected_manager_event =
            Event::new("wasm-my-collection-manager").add_attribute("token-count-before", "1");
        result.assert_event(&expected_manager_event);
        assert_eq!(
            mock_app
                .wrap()
                .query_wasm_smart::<OwnerOfResponse>(
                    addr_collection.to_owned(),
                    &CollectionQueryMsg::OwnerOf {
                        token_id: name_alice.to_string(),
                        include_expired: None,
                    }
                )
                .expect("Failed to query alice name"),
            OwnerOfResponse {
                owner: owner_addr.to_string(),
                approvals: vec![],
            }
        );
        assert_eq!(
            mock_app
                .wrap()
                .query_wasm_smart::<OwnerOfResponse>(
                    addr_collection,
                    &CollectionQueryMsg::OwnerOf {
                        token_id: name_bob.to_string(),
                        include_expired: None,
                    }
                )
                .expect("Failed to query bob name"),
            OwnerOfResponse {
                owner: owner_addr.to_string(),
                approvals: vec![],
            }
        );
    }
    ```
</CodeBlock>

Note how:

* You mint both the names `alice` and `bob`.
* The event when minting `bob` has a `token-count-before` of `1` because `alice`, and only `alice`, exists.

## Conclusion

Your manager smart contract now:

* Queries another smart contract synchronously in a read-only mode.
* Sends a message to another smart contract asynchronously at the end of its own execution.

<HighlightBox type="info" title="Exercise progression">

At this stage:

* The `my-nameservice` project should still have something similar to the [`add-nft-library`](https://github.com/b9lab/cw-my-nameservice/tree/add-nft-library) branch.
* The `my-collection-manager` project should have something similar to the [`cross-contract-query`](https://github.com/b9lab/cw-my-collection-manager/tree/cross-contract-query) branch, with [this](https://github.com/b9lab/cw-my-collection-manager/compare/initial-pass-through..cross-contract-query) as the diff.

</HighlightBox>

What if the message to the other smart contract needed a reply? For instance, the message could create a new item, whose ID your smart contract needs to know for future reference.

This is the object of the reply mechanism in the next section.