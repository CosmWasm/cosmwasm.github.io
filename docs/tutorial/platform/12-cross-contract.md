---
title: First contract integration
description: Send a message from one smart contract to another.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# First contract integration

You have created a name-registering smart contract that is compatible with the NFT standard.
This is a good time to have it receive messages from another smart contract.

:::info Exercise progression

If you skipped the previous section, you can just switch the `my-nameservice` project to its
[`add-nft-library`](https://github.com/b9lab/cw-my-nameservice/tree/add-nft-library) branch and take it from there.

:::

## The use-case

A typical use-case is when an NFT collection delegates the minter to another smart contract.
This _minter_ smart contract could for instance implement an auction, at the end of which,
the auction winner can instruct the minter contract to mint the name auctioned.

In this section, to start with cross-contract communication, you create a manager smart contract
that only passes NFT commands through. Because NFTs are grouped into collections, you call it the collection manager.

## The collection manager project

In another folder, preferably alongside (not inside) your `my-nameservice` folder, you create another Rust project:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        cargo new my-collection-manager --lib --edition 2021
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo new my-collection-manager --lib --edition 2021
        ```
    </TabItem>
</Tabs>

Move into the project directory.

```shell
cd my-collection-manager
```

This project is a CosmWasm one and a smart contract that needs to understand the NFT standard so:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        cargo add cosmwasm-schema@1.5.8 cosmwasm-std@1.5.8 thiserror@1.0.63
        cargo add cw721 --git https://github.com/public-awesome/cw-nfts --tag "v0.19.0"
        cargo add --dev cw-multi-test@1.2.0
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add cosmwasm-schema@1.5.8 cosmwasm-std@1.5.8 thiserror@1.0.63
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add cw721 --git https://github.com/public-awesome/cw-nfts --tag "v0.19.0"
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add --dev cw-multi-test@1.2.0
        ```
    </TabItem>
</Tabs>

Add the WebAssembly alias:

```shell
mkdir .cargo
touch .cargo/config.toml
```

And in it, put:

```toml title=".cargo/config.toml"
[alias]
wasm = "build --release --target wasm32-unknown-unknown"
```

Plus the flags for CosmWasm:

```toml title="Cargo.toml"
[package]
name = "my-collection-manager"
version = "0.1.0"
edition = "2021"

// diff-add-start
+ # Linkage options. More information: https://doc.rust-lang.org/reference/linkage.html
+ [lib]
+ crate-type = ["cdylib", "rlib"]
// diff-add-end

// diff-add-start
+ [features]
+ # Use library feature to disable all instantiate/execute/query exports
+ library = []
// diff-add-end

// diff-add-start
+ # Optimizations in release builds. More information: https://doc.rust-lang.org/cargo/reference/profiles.html
+ [profile.release]
+ opt-level = "z"
+ debug = false
+ rpath = false
+ lto = true
+ debug-assertions = false
+ codegen-units = 1
+ panic = 'abort'
+ incremental = false
+ overflow-checks = true
// diff-add-end

[dependencies]
...
```

Note how:

- This is just a condensed repeat of what was done to prepare `my-nameservice`.
- It does not have `my-nameservice` as a dependency, on `cw721` as it is meant to remain versatile.

## The messages

With a view to make this smart contract versatile, you do not store on-chain the NFT collection's address,
but instead pass it as part of calls.

So your instantiate message does not contain anything:

```rust title="src/msg.rs"
use cosmwasm_schema::cw_serde;
use cosmwasm_std::Empty;
use cw721::msg::Cw721ExecuteMsg;

#[cw_serde]
pub struct InstantiateMsg {}
```

As a pass-through smart contract, for now, there should at least be an execute message variant that contains:

- The target collection's address.
- The message to pass through to it.

In fact, it can apply to any NFT message. So you add:

```rust title="src/msg.rs"
#[cw_serde]
pub enum ExecuteMsg {
    PassThrough {
        collection: String,
        message: Cw721ExecuteMsg<Option<Empty>, Option<Empty>, Empty>,
    },
}
```

Note that:

- It uses the empty extension, which limits its full usability.
- At this stage, there is no point in declaring any query messages.

## The errors

As you did before with `my-nameservice`, you add your simple error messages:

```rust title="src/error.rs"
use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
}
```

## The contract

With these minimal declarations, you have nothing to prepare in `instantiate`,
and you only have to forward the message when finding a `PassThrough`:

```rust title="src/contract.rs"
use crate::{
    error::ContractError,
    msg::{CollectionExecuteMsg, ExecuteMsg, InstantiateMsg},
};
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_json_binary, DepsMut, Env, MessageInfo, Response, WasmMsg};

type ContractResult = Result<Response, ContractError>;

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(_: DepsMut, _: Env, _: MessageInfo, _: InstantiateMsg) -> ContractResult {
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> ContractResult {
    match msg {
        ExecuteMsg::PassThrough {
            collection,
            message,
        } => execute_pass_through(deps, env, info, collection, message),
    }
}

fn execute_pass_through(
    _: DepsMut,
    _: Env,
    info: MessageInfo,
    collection: String,
    message: CollectionExecuteMsg,
) -> ContractResult {
    let onward_exec_msg = WasmMsg::Execute {
        contract_addr: collection,
        msg: to_json_binary(&message)?,
        funds: info.funds,
    };
    Ok(Response::default().add_message(onward_exec_msg))
}
```

Note how:

- To pass the message onwards to the collection you compose a `WasmMsg::Execute` that mentions:
  - The target address, in this case the smart contract that represents the NFT collection.
  - The message to be received, which here has to be a `Cw721ExecuteMsg` of the correct type.
  - A list of the funds that you want the CosmWasm module to:
    - Take from the balance of the sender, here the collection manager.
    - Give them to the message target, here the NFT collection contract itself.
    - Inform the recipient about the funds in the `MessageInfo.funds`.
- Then you add this Wasm message to the response.
- At this stage, your collection manager does not deal with its own funds, so, to avoid leaving funds stranded on its balance,
  it just forwards them on to the NFT collection.
- This type of message passing is of the _fire and forget_ type. In effect, the CosmWasm module will enforce
  the transaction's atomicity: you do not have to handle the error cases coming from the NFT collection.
  Any error coming from the collection will:
  - Revert the actions of the manager, which includes the passing-on of funds,
    which will be returned to the original message sender.
  - Revert any state changes the function may have done.

:::tip Reentrancy?

Take note of how the onward message is sent as part of the returned response.
This ensures that your function has completed its own actions before the next actions are considered.

Of course, it is on you to make sure that the function completes all necessary
actions before the (implicit) `return` statement.

:::

:::danger `info.funds` reuse vulnerability

It is as true with CosmWasm as it is [with Ethereum](https://trustchain.medium.com/ethereum-msg-value-reuse-vulnerability-5afd0aa2bcef):
beware blindly reusing `info.funds`. Indeed, you may send more funds than you have received, or run into analogous situations.
This would result in, for instance, a possible theft of other people's escrows.

Consider this contrived example:

```rust
let onward_exec_msg = WasmMsg::Execute {
    contract_addr: collection.to_owned(),
    msg: to_json_binary(&message)?,
    funds: info.funds.to_owned(), // <-- First time
};
let onward_exec_msg2 = WasmMsg::Execute {
    contract_addr: collection,
    msg: to_json_binary(&message)?,
    funds: info.funds, // <-- Second time
};
Ok(Response::default()
    .add_message(onward_exec_msg)
    .add_message(onward_exec_msg2))
```

Both your messages instruct the CosmWasm module to forward the funds received. But the smart contract received
said funds only once. So the second time it sends funds, it will have to pick them from its pre-existing balance,
i.e. the balance it had before the message was received.

The pre-existing balance can be _other people's escrows_, who store value in this smart contract.

In this contrived example it is somewhat evident, but be mindful that it could be more hidden, as in this pseudocode:

```rust
ExecuteMsg::PassThrough {
    collection,
    message,
} => { 
    execute_pass_through(deps, env, info, collection, message);
    execute_pass_through(deps, env, info, collection, message);
},
```

In this second example, it is not immediately visible that funds are sent twice.

:::

## The library project

Don't forget to put the Rust modules together into `lib.rs`:

```rust title="src/lib.rs"
pub mod contract;
mod error;
pub mod msg;
```

## Unit test

At this stage, there is not much to test. The only thing to test is that the response is as expected:

```rust title="src/contract.rs"
#[cfg(test)]
mod tests {
    use crate::msg::{CollectionExecuteMsg, ExecuteMsg};
    use cosmwasm_std::{testing, to_json_binary, Addr, Coin, Response, Uint128, WasmMsg};

    #[test]
    fn test_pass_through() {
        // Arrange
        let mut mocked_deps_mut = testing::mock_dependencies();
        let mocked_env = testing::mock_env();
        let executer = Addr::unchecked("executer");
        let fund_sent = Coin {
            denom: "gold".to_owned(),
            amount: Uint128::from(335u128),
        };
        let mocked_msg_info = testing::mock_info(executer.as_ref(), &[fund_sent.to_owned()]);
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
            mocked_msg_info,
            execute_msg,
        );

        // Assert
        assert!(contract_result.is_ok(), "Failed to pass message through");
        let received_response = contract_result.unwrap();
        let expected_response = Response::default().add_message(WasmMsg::Execute {
            contract_addr: "collection".to_owned(),
            msg: to_json_binary(&inner_msg).expect("Failed to serialize inner message"),
            funds: vec![fund_sent],
        });
        assert_eq!(received_response, expected_response);
    }
}
```

Note that:

- There is no need to deploy an NFT collection. Not even this manager smart contract.
- You pass _pretend_ funds to the message info. And because the smart contract does not check its balance,
  no extra mocking is necessary.

## Mocked app tests

Now it becomes more interesting. This is where you test the interaction between two smart contracts,
within a mocked CosmWasm module.

You are about to instantiate two smart contracts:

- An NFT collection using `my-nameservice`.
- Your collection manager.

### Considerations

You ought to follow a certain sequence of actions. The NFT collection will be instantiated with the minter's address,
this will save you an extra use of [`Cw721ExecuteMsg::UpdateMinterOwnership`](https://github.com/public-awesome/cw-nfts/blob/v0.19.0/packages/cw721/src/msg.rs#L37).
So you will instantiate the manager first in order to use its address as the minter, so that it can pass through `Mint` calls.

:::tip

It is a good time to remind you that in the `MessageInfo`, the `sender` may be the smart contract that sent this message.
In our case, when passing through, the `sender` will always be the collection manager.

:::

You do not yet have a dependency on your `my-nameservice` project. You want it only for tests,
that means you add it as a _dev_ dependency, taking care to adjust if your paths are different:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        cargo add my-nameservice --dev --path ../my-nameservice --rename my-nameservice
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd)/..:/root/ -w /root/my-collection-manager \
            rust:1.80.1 \
            cargo add my-nameservice --dev --path ../my-nameservice --rename my-nameservice 
        ```
    </TabItem>
</Tabs>

These tests are another way to confirm that your name service conforms to the expectations of the NFTs library.
To confirm it does, you will:

- Deploy the collection smart contract from the code of `my-nameservice`, and its own `InstantiateMsg`,
  since we can expect the owner of the collection to proceed like this.
- Build the _execute_ amd _query_ messages only from the NFT library's own execute messages,
  as this would be what a user of the collection manager would do.

Create the `tests/contract.rs` file.

### Helpers

As when preparing mocked app tests earlier, you can have helpers to deploy your smart contracts.
The collection, using the name service code:

```rust title="tests/contract.rs"
use cosmwasm_std::{to_json_binary, Addr, Empty, Event};
use cw721::msg::{Cw721ExecuteMsg, Cw721QueryMsg, OwnerOfResponse};
use cw_multi_test::{App, ContractWrapper, Executor};
use cw_my_collection_manager::{
    contract::{execute, instantiate},
    msg::{ExecuteMsg, InstantiateMsg},
};
use cw_my_nameservice::{
    contract::{
        execute as execute_my_nameservice, instantiate as instantiate_my_nameservice,
        query as query_my_nameservice,
    },
    msg::InstantiateMsg as MyNameserviceInstantiateMsg,
};

pub type CollectionExecuteMsg = Cw721ExecuteMsg<Option<Empty>, Option<Empty>, Empty>;
pub type CollectionQueryMsg = Cw721QueryMsg<Option<Empty>, Option<Empty>, Empty>;

fn instantiate_nameservice(mock_app: &mut App, minter: String) -> (u64, Addr) {
    let nameservice_code = Box::new(ContractWrapper::new(
        execute_my_nameservice,
        instantiate_my_nameservice,
        query_my_nameservice,
    ));
    let nameservice_code_id = mock_app.store_code(nameservice_code);
    (
        nameservice_code_id,
        mock_app
            .instantiate_contract(
                nameservice_code_id,
                Addr::unchecked("deployer-my-nameservice"),
                &MyNameserviceInstantiateMsg {
                    name: "my names".to_owned(),
                    symbol: "MYN".to_owned(),
                    creator: None,
                    minter: Some(minter),
                    collection_info_extension: None,
                    withdraw_address: None,
                },
                &[],
                "nameservice",
                None,
            )
            .expect("Failed to instantiate my nameservice"),
    )
}
```

Note that:

- It contains all the imports for the upcoming test functions too.
- Imports coming from `my-nameservice` are aliased to avoid confusion.

Also add a helper to instantiate your collection manager:

```rust title="tests/contract.rs"
fn instantiate_collection_manager(mock_app: &mut App) -> (u64, Addr) {
    let code = Box::new(ContractWrapper::new(execute, instantiate, |_, _, _: ()| {
        to_json_binary("mocked_manager_query")
    }));
    let manager_code_id = mock_app.store_code(code);

    (
        manager_code_id,
        mock_app
            .instantiate_contract(
                manager_code_id,
                Addr::unchecked("deployer-manager"),
                &InstantiateMsg {},
                &[],
                "my-collection-manager",
                None,
            )
            .expect("Failed to instantiate collection manager"),
    )
}
```

Note that:

- There is a dummy lambda in place of the missing query function.

### Test the pass-through

In this test, you want to confirm that the collection correctly minted the name that the collection manager forwarded to it:

```rust title="tests/contract.rs"
#[test]
fn test_mint_through() {
    // Arrange
    let mut mock_app = App::default();
    let (_, addr_manager) = instantiate_collection_manager(&mut mock_app);
    let (_, addr_collection) = instantiate_nameservice(&mut mock_app, addr_manager.to_string());
    let owner_addr = Addr::unchecked("owner");
    let name_alice = "alice".to_owned();
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

    // Act
    let result = mock_app.execute_contract(
        sender_addr.clone(),
        addr_manager.clone(),
        &register_msg,
        &[],
    );

    // Assert
    assert!(result.is_ok(), "Failed to pass through the message");
    let result = result.unwrap();
    let expected_cw721_event = Event::new("wasm")
        .add_attribute("_contract_address", addr_collection.to_string())
        .add_attribute("action", "mint")
        .add_attribute("token_id", name_alice.to_string())
        .add_attribute("owner", owner_addr.to_string());
    result.assert_event(&expected_cw721_event);
    let owner_query = CollectionQueryMsg::OwnerOf {
        token_id: name_alice.to_string(),
        include_expired: None,
    };
    let result = mock_app
        .wrap()
        .query_wasm_smart::<OwnerOfResponse>(addr_collection, &owner_query);
    assert!(result.is_ok(), "Failed to query alice name");
    assert_eq!(
        result.unwrap(),
        OwnerOfResponse {
            owner: owner_addr.to_string(),
            approvals: vec![],
        }
    );
}
```

Note that:

- The collection is deployed after the manager and uses its address.
- In mocked app tests, you could in fact guess the addresses of the deployed instances. They are `contract0`,
  `contract1` and so forth purely depending on the order of deployment.
- After the collection is deployed, there is no use of anything imported from `my-nameservice`.
- You query the collection independently of the collection manager.

### Run the tests

To run the tests, it is the same command as before, with the caveat that the `my-nameservice` folder has to be accessible.
From within `my-collection-manager`, you run:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        cargo test
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd)/..:/root/ -w /root/my-collection-manager \
            rust:1.80.1 \
            cargo test
        ```
    </TabItem>
</Tabs>

## Conclusion

You have built a smart contract that sends messages to another in order to execute an action on the remote one.

You could test more things such as:

- Confirm that a single message with two `PassThrough` messages for two different collections works as expected.
- When the manager contract is made the owner of a name, it is able to transfer it to another address
  with a different pass-through message.
- Confirm that an invalid message, such a non-owner trying to transfer a name, results in an error.

These are left as an exercise.

:::info Exercise progression

At this stage:

- The `my-nameservice` project should have something similar to the
  [`add-nft-library`](https://github.com/b9lab/cw-my-nameservice/tree/add-nft-library) branch.
- The `my-collection-manager` project should have something similar to the
  [`initial-pass-through`](https://github.com/b9lab/cw-my-collection-manager/tree/initial-pass-through) branch.

:::
