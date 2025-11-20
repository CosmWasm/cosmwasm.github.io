---
title: Use the NFT Library
description: Instead of reinventing the wheel.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Use the NFT Library

Your smart contract that can register names sounds an awful lot like the _mint_ function of non-fungible tokens (NFTs).
You even added a minter that gatekeeps the minting. Eventually, you can imagine adding functionality so that the name
owners can transfer, or sell, those names.

:::info Exercise progression

If you skipped the previous section, you can just switch the project to its
[`add-first-library`](https://github.com/b9lab/cw-my-nameservice/tree/add-first-library) branch and take it from there.

:::

Instead of reinventing the wheel, you could reuse an NFT library.
[`cw721`](https://crates.io/crates/cw721) is one such library.
Its code is [here](https://github.com/public-awesome/cw-nfts).
An additional advantage of using a library that acts close to a standard is that your smart contract
is going to be compatible with other smart contracts that are compatible with the standard.

Let's refactor in order to use it. You are going to:

1. Change the dependencies.
2. Decide how much of the library you are going to use.
3. Decide what to still declare in storage and what to delegate.
4. Ditto for messages.
5. Update the smart contract handling of messages.
6. Update the tests.

## Add the dependency

<Tabs groupId="local-docker">
    <TabItem value="Local" active>
        ```shell
        cargo add cw721 --git https://github.com/public-awesome/cw-nfts --tag "v0.19.0"
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add cw721 --git https://github.com/public-awesome/cw-nfts --tag "v0.19.0"
        ```
    </TabItem>
</Tabs>

Note:

* At the time of writing, the 0.19.0 version is not yet published, which is why you have to call it via Github.

Additionally:

* The [`ownable`](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/Cargo.toml#L29) and [`cw-storage-plus`](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/Cargo.toml#L31) libraries come with `cw721`, so you don't need to mention them on their own:
    
    ```toml title="Cargo.toml"
      ...
      [dependencies]
    //diff-del-start    
    - cw-ownable = "2.1.0"
    - cw-storage-plus = "2.0.0"
    //diff-del-end
      ...
    ```

* The current version requires [CosmWasm v1.5+](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/Cargo.toml#L16-L17), so you have to downgrade your versions, including `cw-multi-test`, even though it is [used by `cw721`](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/Cargo.toml#L28):
    
    ```toml title="Cargo.toml"
      ...
      [dependencies]
    //diff-del-start
    - cosmwasm-schema = "2.1.3"
    - cosmwasm-std = "2.1.3"
    //diff-del-end
    //diff-add-start
    + cosmwasm-schema = "1.5.8"
    + cosmwasm-std = "1.5.8"
    //diff-add-end
      ...
    
      [dev-dependencies]
    //diff-del
    - cw-multi-test = "2.1.1"
    //diff-add
    + cw-multi-test = "1.2.0"
    ```

## Decide on the types

This NFT library is itself a large body of work and you have to decide on how you are going to use it. In its jargon, an _extension_ is the additional information relative to the NFT, such as URL or even content, which could be stored on- or off-chain. In order to cleave as close as possible to what you have already done, you pick an [empty extension](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/packages/cw721/src/extension.rs#L95), so that what remains are:

* _Token id_, which maps directly to the registered name.
* _Owner_, which is the same concept as previously.

## How state changes

Since the NFT library takes care of the records and the minter, you do not need to declare anything:

<CodeBlock title="src/state.rs">
    ```diff-rust
    - use cosmwasm_schema::cw_serde;
    - use cosmwasm_std::Addr;
    - use cw_ownable::OwnershipStore;
    - use cw_storage_plus::Map;

    - #[cw_serde]
    - pub struct NameRecord {
    -     pub owner: Addr,
    - }

    - pub const NAME_RESOLVER: Map<&[u8], NameRecord> = Map::new("name_resolver");
    - pub const MINTER: OwnershipStore = OwnershipStore::new("name_minter");
    ```
</CodeBlock>

It is ok to keep an empty file to signify that having nothing is indeed a decision and not an omission.

## How errors change

You get a new class of errors, those of the library. And since you delegate registration and minter actions, all you have to do is wrap the new class of errors:

<CodeBlock title="src/error.rs">
    ```diff-rust
    - use cosmwasm_std::{Addr, StdError};
    - use cw_ownable::OwnershipError;
    + use cosmwasm_std::StdError;
    + use cw721::error::Cw721ContractError;
      use thiserror::Error;

      pub enum ContractError {
          #[error("{0}")]
          Std(#[from] StdError),
    -     #[error("Name already taken ({name})")]
    -     NameTaken { name: String },
    -     #[error("Caller ({caller}) is not minter")]
    -     Minter {
    -         caller: String,
    -         inner: OwnershipError,
    -     },
    +     #[error("{0}")]
    +     Cw721(#[from] Cw721ContractError),
      }
    
    - impl ContractError {
    -     pub fn from_minter<'a>(caller: &'a Addr) -> impl Fn(OwnershipError) -> ContractError + 'a {
    -         move |inner: OwnershipError| ContractError::Minter {
    -             caller: caller.to_string(),
    -             inner,
    -         }
    -     }
    - }
    ```
</CodeBlock>

Note how, thanks to the `#from` macro, `Cw721ContractError` can also be _automagically_ converted to `ContractError`.

## How messages change

Your goal with this change is also to maximize compatilibity. So to make sure that other smart contracts can communicate with yours, you keep the standard's messages unchanged, with the knowledge that you have picked an empty extension:

<CodeBlock title="src/msg.rs">
    ```diff-rust
    - use cosmwasm_schema::{cw_serde, QueryResponses};
    - use cosmwasm_std::Addr;
    + use cosmwasm_std::Empty;
    + use cw721::msg::{Cw721ExecuteMsg, Cw721InstantiateMsg, Cw721QueryMsg};

    - #[cw_serde]
    - pub struct InstantiateMsg {
    -     pub minter: String,
    - }
    + pub type InstantiateMsg = Cw721InstantiateMsg<Option<Empty>>;

    - #[cw_serde]
    - pub enum ExecuteMsg {
    -     Register { name: String, owner: Addr },
    - }
    + pub type ExecuteMsg = Cw721ExecuteMsg<Option<Empty>, Option<Empty>, Empty>;

    - #[cw_serde]
    - #[derive(QueryResponses)]
    - pub enum QueryMsg {
    -     #[returns(ResolveRecordResponse)]
    -     ResolveRecord { name: String },
    - }
    + pub type QueryMsg = Cw721QueryMsg<Option<Empty>, Option<Empty>, Empty>;

    - #[cw_serde]
    - pub struct ResolveRecordResponse {
    -     pub address: Option<String>,
    - }
    ```
</CodeBlock>

Note that defining type aliases is a convenience rather than a necessity.

## How the contract changes

From here, all your smart contract has to do is to delegate actions to the equivalent ones from the library, with the knowledge that you have picked an empty extension. The library allows you a certain degree of configuration, but for your purposes, invoking the similarly-named functions on `Cw721EmptyExtensions::default()` gets you what you need.

<CodeBlock title="src/contract.rs">
    ```diff-rust
    - use crate::{
          error::ContractError,
    -     msg::{ExecuteMsg, InstantiateMsg, QueryMsg, ResolveRecordResponse},
    -     state::{NameRecord, MINTER, NAME_RESOLVER},
    +     msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
      };
      use cosmwasm_std::{
    -     entry_point, to_json_binary, Addr, Binary, Deps, DepsMut, Env, Event, MessageInfo, Response, StdResult,
    +     entry_point, Binary, Deps, DepsMut, Env, MessageInfo, Response,
      };
    + use cw721::{
    +     extension::Cw721EmptyExtensions,
    +     traits::{Cw721Execute, Cw721Query},
    + };

      type ContractResult = Result<Response, ContractError>;
    + type BinaryResult = Result<Binary, ContractError>;

      pub fn instantiate(
          deps: DepsMut,
    -     _: Env,
    -     _: MessageInfo,
    +     env: Env,
    +     info: MessageInfo,
          msg: InstantiateMsg,
      ) -> ContractResult {
    -     let _ = MINTER.initialize_owner(deps.storage, deps.api, Some(msg.minter.as_str()))?;
    -     Ok(Response::default())
    +     Ok(Cw721EmptyExtensions::default().instantiate(deps, &env, &info, msg)?)
      }

      pub fn execute(
          deps: DepsMut,
    -     _: Env,
    +     env: Env,
          info: MessageInfo,
          msg: ExecuteMsg,
      ) -> ContractResult {
    -   match msg {
    -       ExecuteMsg::Register { name, owner } => execute_register(deps, info, name, &owner),
    -   }
    +     Ok(Cw721EmptyExtensions::default().execute(deps, &env, &info, msg)?)
      }

    - fn execute_register(...) {
    -     ...
    - }

      ...

      pub fn query(
          deps: Deps,
    -     _: Env,
    +     env: Env,
          msg: QueryMsg,
    - ) -> StdResult<Binary> {
    -     match msg {
    -         QueryMsg::ResolveRecord { name } => query_resolve_record(deps, name),
    -     }
    + ) -> BinaryResult {
    +     Ok(Cw721EmptyExtensions::default().query(deps, &env, msg)?)
      }

    - fn query_resolve_record() {
    -     ...
    - }
    ```
</CodeBlock>

Note how:

* It's a matter of passing the error along with a `?` to benefit from the `#from` macro constructor.
* And a matter of wrapping the values in an `Ok` result.
* You introduce the type `BinaryResult` so as to benefit succinctly from the error's `#from` constructor when querying.
* You do not add your own event for convenience. To do so meaningfully, you would have to first find out which message type is passing through.
* The `Register` equivalent in the library is `Mint`, which already emits its relevant events.

## Update your unit tests

Many things have changed, but in essence, you mostly have to:

* Adjust for the change of CosmWasm version from 2 to 1.
* Change how your messages are built.
* Change the storage checks with newly appropriate ones, including the storage keys.

### The dummy instantiation message

The new [`InstantiateMsg`](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/packages/cw721/src/msg.rs#L126-L143)
has a long list of attributes, most of which you do not care much about in unit tests.
It is worthwhile taking this into a separate function:

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      mod tests {
          ...
    +     fn simple_instantiate_msg(minter: String) -> InstantiateMsg {
    +         InstantiateMsg {
    +             name: "my names".to_owned(),
    +             symbol: "MYN".to_owned(),
    +             creator: None,
    +             minter: Some(minter.to_string()),
    +             collection_info_extension: None,
    +             withdraw_address: None,
    +         }
    +     }
          ...

          #[test]
          fn test_instantiate() {
              ...
          }
      }
    ```
</CodeBlock>

### Instantiate

What you want to test is that you can instantiate and have the minter set as expected.

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      mod tests {
          use crate::{
              msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
    -         state::{NameRecord, MINTER, NAME_RESOLVER},
          }
    -     use cosmwasm_std::{testing, Addr, Api, Binary, CanonicalAddr, Event, Response};
    +     use cosmwasm_std::{testing, Addr, Binary, Response};
    +     use cw721::{
    +         extension::Cw721EmptyExtensions,
    +         state::{NftInfo, MINTER},
    +     };

          ...

          #[test]
          fn test_instantiate() {
              ...
    -         let mocked_msg_info = testing::message_info(&mocked_addr, &[]);
    +         let mocked_msg_info = testing::mock_info(&mocked_addr.to_string(), &[]);
    -         let minter = mocked_deps_mut
    -             .api
    -             .addr_humanize(&CanonicalAddr::from("minter".as_bytes()))
    -             .expect("Failed to create minter address");
    +         let minter = Addr::unchecked("minter");
    -         let instantiate_msg = InstantiateMsg {
    -             minter: minter.to_string(),
    -         };
    +         let instantiate_msg = simple_instantiate_msg(minter.to_string());
              ...
    -         assert_eq!(contract_result.unwrap(), Response::default());
    +         assert_eq!(
    +             contract_result.unwrap(),
    +             Response::default()
    +                 .add_attribute("minter", "minter")
    +                 .add_attribute("creator", "addr")
    +         );
              ...
          }
      }
    ```
</CodeBlock>

Note how:

* Changes look mostly cosmetic.
* There is no change to the assertion on `MINTER` other than now the `use` statement:
  * Refers to `cw721::state::MINTER`,
  * Instead of `crate::state::MINTER`.
* The assertion on `MINTER` is unchanged because it uses `.assert_owner`, which is found in the `ownable` library, whether you import it yourself, or `cw721` does.
* The NFT library does not create an elegantly separate event, instead it adds straight attributes to the response. This behaviour depends on the library you use.

### Execute

Here, you have to bring the same changes to the _arrange_ part, then verify that the data was saved by using the library. It is a bit more involved.

The information about NFTs is stored in a map named [`.nft_info`](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/packages/cw721/src/state.rs#L58), and because of your choices here, the values stored are deserialized to the type `NftInfo<Option<Empty>>`. You access the map with `Cw721EmptyExtensions::default().config.nft_info`.

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      mod tests {
          ...

          #[test]
          fn test_execute() {
              ...
    -         let minter = mocked_deps_mut
    -             .api
    -             .addr_humanize(&CanonicalAddr::from("minter".as_bytes()))
    -             .expect("Failed to create minter address");
    +         let minter = Addr::unchecked("minter");
              let _ = super::instantiate(
                  mocked_deps_mut.as_mut(),
                  mocked_env.to_owned(),
    -             testing::message_info(&mocked_addr, &[]),
    +             testing::mock_info(&mocked_addr.to_string(), &[]),
    -             InstantiateMsg {
    -                 minter: minter.to_string(),
    -             },
    +             simple_instantiate_msg(minter.to_string()),
              )
              ...
    -         let mocked_msg_info = testing::message_info(&minter, &[]);
    +         let mocked_msg_info = testing::mock_info(&minter.to_string(), &[]);
              ...
    -         let execute_msg = ExecuteMsg::Register {
    -             name: name.clone(),
    -             owner: owner.to_owned(),
    +         let execute_msg = ExecuteMsg::Mint {
    +             token_id: name.to_owned(),
    +             owner: owner.to_string(),
    +             token_uri: None,
    +             extension: None,
              };
              ...
    -         let expected_event = Event::new("name-register")
    -             .add_attribute("name", name.to_owned())
    -             .add_attribute("owner", owner.to_string());
    -         let expected_response = Response::default().add_event(expected_event);
    +         let expected_response = Response::default()
    +             .add_attribute("action", "mint")
    +             .add_attribute("minter", "minter")
    +             .add_attribute("owner", "owner")
    +             .add_attribute("token_id", "alice");
              ...
    -         assert!(NAME_RESOLVER.has(mocked_deps_mut.as_ref().storage, name.as_bytes()));
    +         assert!(Cw721EmptyExtensions::default()
    +             .config
    +             .nft_info
    +             .has(mocked_deps_mut.as_ref().storage, name.as_str()));
    -         let stored = NAME_RESOLVER.load(mocked_deps_mut.as_ref().storage, name.as_bytes());
    +         let stored = Cw721EmptyExtensions::default()
    +             .config
    +             .nft_info
    +             .load(mocked_deps_mut.as_ref().storage, name.as_str());
              assert!(stored.is_ok());
              assert_eq!(
                  stored.unwrap(),
    -             NameRecord { owner: owner }
    +             NftInfo {
    +                 owner: owner,
    +                 approvals: [].to_vec(),
    +                 token_uri: None,
    +                 extension: None,
    +             }
              );
          }
      }
    ```
</CodeBlock>

Note how:

* The `Register` message is now `Mint`.
* Here too, there is no separate event but the attributes are added to the main result.
* Previously you accessed the storage map with `NAME_RESOLVER`, now you achieve the same be digging a bit to `nft_info`.
* The `Mint` message and the `stored` object both mention `token_uri` and `extension` as `None`. That's a result of your choice of picking `Cw721EmptyExtensions`.

### Query

To test the query, you need to retrace both the instantiate and execute steps.

<CodeBlock title="src/contract.rs">
    ```diff-rust
      ...
      mod tests {
          ...

          #[test]
          fn test_query() {
              ...
    -         let minter = mocked_deps_mut
    -             .api
    -             .addr_humanize(&CanonicalAddr::from("minter".as_bytes()))
    -             .expect("Failed to create minter address");
    +         let minter = Addr::unchecked("minter");
              let _ = super::instantiate(
                  mocked_deps_mut.as_mut(),
                  mocked_env.to_owned(),
    -             testing::message_info(&mocked_addr, &[]),
    +             testing::mock_info(&mocked_addr.to_string(), &[]),
    -             InstantiateMsg {
    -                 minter: minter.to_string(),
    -             },
    +             simple_instantiate_msg(minter.to_string()),
              )
              ...
    -         let mocked_msg_info = testing::message_info(&minter, &[]);
    +         let mocked_msg_info = testing::mock_info(&minter.to_string(), &[]);
    +         let execute_msg = ExecuteMsg::Mint {
    +             token_id: name.to_owned(),
    +             owner: mocked_addr.to_string(),
    +             token_uri: None,
    +             extension: None,
    +         };
              ...
    -         let _ = super::execute_register(
    +         let _ = super::execute(
                  mocked_deps_mut.as_mut(),
    +             mocked_env.to_owned(),
                  mocked_msg_info,
    -             name.clone(),
    -             &mocked_addr,
    +             execute_msg,
              );
              ...
    -         let query_msg = QueryMsg::ResolveRecord { name };
    +         let query_msg = QueryMsg::OwnerOf {
    +             token_id: name,
    +             include_expired: None,
    +         };
              ...
    -         let expected_response = format!(r#"{{"address":"{mocked_addr_value}"}}"#);
    +         let expected_response = format!(r#"{{"owner":"{mocked_addr_value}","approvals":[]}}"#);
    -         let expected = Binary::new(expected_response.as_bytes().to_vec());
    +         let expected = Binary::from(expected_response.as_bytes());
              ...
          }
      }
    ```
</CodeBlock>

Note how:

* `QueryMsg` now offers a long list of variants, of which the most succinct for the test is `OwnerOf`.

## Update your mocked app tests

Here, as for the unit tests you need to:

* Adjust for the change of CosmWasm version from 2 to 1.
* Change how your messages are built.
* Change the event and storage checks with newly appropriate ones, including the storage keys.

### The deploy helper

This function exists to assist you in proper tests. Without surprise, it changes to reflect the current status:

<CodeBlock title="tests/contract.rs">
    ```diff-rust
      ...
    - type ContractAddr = Addr;
    - type MinterAddr = Addr;

    - fn instantiate_nameservice(mock_app: &mut App) -> (u64, ContractAddr, MinterAddr) {
    + fn instantiate_nameservice(mock_app: &mut App) -> (u64, Addr) {
          ...
    -     let minter = mock_app
    -         .api()
    -         .addr_humanize(&CanonicalAddr::from("minter".as_bytes()))
    -         .unwrap();
          return (
              nameservice_code_id,
              mock_app
                  .instantiate_contract(
                      ...
                      &InstantiateMsg {
    +                     name: "my names".to_owned(),
    +                     symbol: "MYN".to_owned(),
    +                     creator: None,
    -                     minter: minter.to_string(),
    +                     minter: Some("minter".to_owned()),
    +                     collection_info_extension: None,
    +                     withdraw_address: None,
                      },
                      ...
                  )
                  .expect("Failed to instantiate nameservice"),
    -         minter
          );
      }
    ```
</CodeBlock>

Note that:

* You no longer need to disambiguate the 2 returned `Addr`.
* As in the unit tests, the `InstantiateMsg` is longer but full of dummy data or `None`s.

### Execute

The difficulty here is to get access to the right values in storage when accessing it directly.

<CodeBlock title="tests/contract.rs">
    ```diff-rust
    - use cosmwasm_std::{Addr, Api, CanonicalAddr, Event};
    + use cosmwasm_std::{Addr, Event, StdError, Storage};
    + use cw721::msg::OwnerOfResponse;
      use cw_multi_test::{App, ContractWrapper, Executor};
      use cw_my_nameservice::{
          contract::{execute, instantiate, query},
    -     msg::{ExecuteMsg, InstantiateMsg, QueryMsg, ResolveRecordResponse},
    +     msg::{ExecuteMsg, InstantiateMsg, QueryMsg},
      };

      ...

      fn test_register() {
          ...
    -     let (_, contract_addr, minter) = instantiate_nameservice(&mut mock_app);
    +     let (_, contract_addr) = instantiate_nameservice(&mut mock_app);
          ...
    -     let register_msg = ExecuteMsg::Register {
    +     let register_msg = ExecuteMsg::Mint {
    -         name: name_alice.to_owned(),
    +         token_id: name_alice.to_owned(),
    -         owner: owner_addr.to_owned(),
    +         owner: owner_addr.to_string(),
    +         extension: None,
    +         token_uri: None,
          };
          ...
          let result = mock_app.execute_contract(
    -         minter,
    +         Addr::unchecked("minter"),
              ...
          );
          ...
    -     let expected_event = Event::new("wasm-name-register")
    +     let expected_event = Event::new("wasm")
    +         .add_attribute("_contract_address", "contract0".to_owned())
    +         .add_attribute("action", "mint".to_owned())
    +         .add_attribute("minter", "minter".to_owned())
    -         .add_attribute("name", name_alice.to_owned())
    -         .add_attribute("owner", owner_addr_value.to_owned());
    +         .add_attribute("owner", owner_addr_value.to_owned())
    +         .add_attribute("token_id", name_alice.to_owned());
          ...
    +     // Global storage
    +     let expected_key_main =
    +         format!("\0\u{4}wasm\0\u{17}contract_data/contract0\0\u{6}tokens{name_alice}",);
    +     let stored_addr_bytes = mock_app
    +         .storage()
    +         .get(expected_key_main.as_bytes())
    +         .expect("Failed to load from name alice");
    +     let stored_addr = String::from_utf8(stored_addr_bytes).unwrap();
    +     assert_eq!(
    +         stored_addr,
    +         format!(
    +             r#"{{"owner":"{owner_addr_value}","approvals":[],"token_uri":null,"extension":null}}"#
    +         )
    +     );
    +     // Storage local to contract
          let stored_addr_bytes = mock_app
              .contract_storage(&contract_addr)
    -         .get(format!("\0\rname_resolver{name_alice}").as_bytes())
    +         .get(format!("\0\u{6}tokens{name_alice}").as_bytes())
              .expect("Failed to load from name alice");
          ...
          assert_eq!(
              stored_addr,
    -         format!(r#"{{"owner":"{owner_addr_value}"}}"#)
    +         format!(
    +             r#"{{"owner":"{owner_addr_value}","approvals":[],"token_uri":null,"extension":null}}"#
    +         )
          );
      }
    ```
</CodeBlock>

Note how:

* The attributes are now piled int the `wasm` event, which is always there as it is added by the CosmWasm module, or the mocked app as seen here.
* You confirm that you can access the NFT info with a global storage key.
* You also check that you can access the same info from a key relative to the smart contract's storage area. That assists in visualizing what is taking place within the library.
* These long keys can be explained:
  * `"\0\u{4}wasm"` is the prefix of all storage handled by CosmWasm.
  * `"\0\u{17}contract_data/"` is the next prefix that CosmWasm reserves to store all smart contract data.
  * `"contract0"` is the next prefix that CosmWasm uses for all the storage of your smart contract being tested. `0` is the instance id, this strictly incrementing number.
  * `"\0\u{6}tokens"` is the [next prefix](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/packages/cw721/src/state.rs#L73) that the library uses to store `nft_info`, and where `"\0\u{6}"` identifies an [`IndexedMap`](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/packages/cw721/src/state.rs#L100).
  * `"alice"`, the last element, is the key of the value in the indexed map.

<details>
  <summary>If you are unsure about the keys in storage</summary>

You can retrieve them all, as long as there are not too many of them, with:

```rust
println!("{:?}", mock_app.storage());
```

Then, in order to get the logs while testing, you add the `-- --nocapture` flag like so:

<Tabs groupId="local-docker">
    <TabItem value="Local" active>
        ```shell
        cargo test -- --nocapture
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo test -- --nocapture
        ```
    </TabItem>
</Tabs>

Which prints something along the lines of:

```text
MemoryStorage (7 entries) {
  0x00047761736d0009636f6e747261637473636f6e747261637430: 0x7b22636f64655f6964223a312c2263726561746f72223a226465706c6f796572222c2261646d696e223a6e756c6c2c226c6162656c223a226e616d6573657276696365222c2263726561746564223a31323334357d
  0x00047761736d0017636f6e74726163745f646174612f636f6e7472616374300006746f6b656e73616c696365: 0x7b226f776e6572223a226f776e6572222c22617070726f76616c73223a5b5d2c22746f6b656e5f757269223a6e756c6c2c22657874656e73696f6e223a6e756c6c7d
  0x00047761736d0017636f6e74726163745f646174612f636f6e747261637430000d746f6b656e735f5f6f776e657200056f776e6572616c696365: 0x35
  0x00047761736d0017636f6e74726163745f646174612f636f6e747261637430636f6c6c656374696f6e5f6d696e746572: 0x7b226f776e6572223a226d696e746572222c2270656e64696e675f6f776e6572223a6e756c6c2c2270656e64696e675f657870697279223a6e756c6c7d
  0x00047761736d0017636f6e74726163745f646174612f636f6e74726163743063773732315f636f6c6c656374696f6e5f696e666f: 0x7b226e616d65223a226d79206e616d6573222c2273796d626f6c223a224d594e222c22757064617465645f6174223a2231353731373937343139383739333035353333227d
  0x00047761736d0017636f6e74726163745f646174612f636f6e7472616374306e756d5f746f6b656e73: 0x31
  0x00047761736d0017636f6e74726163745f646174612f636f6e7472616374306f776e657273686970: 0x7b226f776e6572223a226465706c6f796572222c2270656e64696e675f6f776e6572223a6e756c6c2c2270656e64696e675f657870697279223a6e756c6c7d
}
```

For instance, on the second line:

- `0x00047761736d0017636f6e74726163745f646174612f636f6e7472616374300006746f6b656e73616c696365`
  is `"\0\u{4}wasm\0\u{17}contract_data/contract0\0\u{6}tokensalice"`,
  which you can confirm with converters such as [this one](https://www.duplichecker.com/ascii-to-text.php).
- And the value to its right is `{"owner":"owner","approvals":[],"token_uri":null,"extension":null}`.

</details>

### Query(s)

To be able to get to the query, you have to retrace the same steps as when testing the execution. Then it is only a matter of changing the `QueryMsg` types.

<CodeBlock title="tests/contract.rs">
    ```diff-rust

      fn test_query() {
          ...
    -     let (_, contract_addr, minter) = instantiate_nameservice(&mut mock_app);
    +     let (_, contract_addr) = instantiate_nameservice(&mut mock_app);
          ...
    -     let register_msg = ExecuteMsg::Register {
    +     let register_msg = ExecuteMsg::Mint {
    -         name: name_alice.to_owned(),
    +         token_id: name_alice.to_owned(),
    -         owner: owner_addr.to_owned(),
    +         owner: owner_addr.to_string(),
    +         extension: None,
    +         token_uri: None,
          };
          ...
          let _ = mock_app
              .execute_contract(
    -             minter,
    +             Addr::unchecked("minter"),
                  ...
              )
              .expect("Failed to register alice");
    -     let resolve_record_query_msg = QueryMsg::ResolveRecord {
    +     let resolve_record_query_msg = QueryMsg::OwnerOf {
    -         name: name_alice.to_owned(),
    +         token_id: name_alice.to_owned(),
    +         include_expired: None,
    +     };
          ...
          let result = mock_app
              .wrap()
    -         .query_wasm_smart::<ResolveRecordResponse>(&contract_addr, &resolve_record_query_msg);
    +         .query_wasm_smart::<OwnerOfResponse>(&contract_addr, &resolve_record_query_msg);
          ...
          assert_eq!(
              result.unwrap(),
    -         ResolveRecordResponse {
    +         OwnerOfResponse {
    -             address: Some(owner_addr.to_string())
    +             owner: owner_addr.to_string(),
    +             approvals: [].to_vec(),
              }
          );
      }

      fn test_query_empty() {
          ...
    -     let (_, contract_addr, _) = instantiate_nameservice(&mut mock_app);
    +     let (_, contract_addr) = instantiate_nameservice(&mut mock_app);
          let name_alice = "alice".to_owned();
    -     let resolve_record_query_msg = QueryMsg::ResolveRecord {
    +     let resolve_record_query_msg = QueryMsg::OwnerOf {
    -         name: name_alice.to_owned(),
    +         token_id: name_alice.to_owned(),
    +         include_expired: None,
          };
          ...
          let result = mock_app
              .wrap()
    -         .query_wasm_smart::<ResolveRecordResponse>(&contract_addr, &resolve_record_query_msg);
    +         .query_wasm_smart::<OwnerOfResponse>(&contract_addr, &resolve_record_query_msg);
          ...
    -     assert!(result.is_ok(), "Failed to query alice name");
    +     assert!(result.is_err(), "There was an unexpected value");
    -     assert_eq!(result.unwrap(), ResolveRecordResponse { address: None })
    +     assert_eq!(result.unwrap_err(), StdError::GenericErr { 
    +         msg: "Querier contract error: type: cw721::state::NftInfo<core::option::Option<cosmwasm_std::results::empty::Empty>>; key: [00, 06, 74, 6F, 6B, 65, 6E, 73, 61, 6C, 69, 63, 65] not found".to_owned(),
    +     });
      }
    ```
</CodeBlock>

Note that:

- The new response type is [`OwnerOfResponse`](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/packages/cw721/src/msg.rs#L155-L157).
- If a record is missing it returns an error instead of a `None` as you did earlier.
- Said error is quite verbose and cannot really be guessed. Its list of bytes represents `"\0\u{6}tokensalice"`.

## Conclusion

Now that you delegate to the NFT library, it could be worthwhile to test that the other features you expect are present,
such as approvals and transfers. It would be good to also confirm that the minter indeed gatekeeps the minting call.
This is left as an exercise.

:::info Exercise progression

At this stage, you should have something similar to the
[`add-nft-library`](https://github.com/b9lab/cw-my-nameservice/tree/add-nft-library) branch,
with [this](https://github.com/b9lab/cw-my-nameservice/compare/add-first-library..add-nft-library) as the diff.

:::

You have added the NFT library to increase your compatibility with other smart contracts.
In the next section, you learn how to have cross-contract communication.
