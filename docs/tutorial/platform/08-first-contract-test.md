---
title: First integration test
description: Get closer to simulating your smart contract on a CosmWasm blockchain.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# First integration test

So far, you have tested your smart contract with unit tests. These unit tests help you verify that your functions
work as expected in isolation. However, they do not let you check whether your smart contract would work
correctly on a blockchain, or with each other.

You are fixing that in this section.

:::info Exercise progression

If you skipped the previous section, you can just switch the project to its
[`first-query-message`](https://github.com/b9lab/cw-my-nameservice/tree/first-query-message)
branch and take it from there.

:::

## Structure

You are going to use [MultiTest](https://docs.cosmwasm.com/cw-multi-test), which mocks an underlying blockchain,
complete with mocked modules such as _Bank_. These mocks and tools are still all in Rust, which ensures speed.
They would also allow you to test cross-contract communication.

Because the tests take place in Rust, there is no compilation to WebAssembly.
So to mimic a compiled object, there is a
[`ContractWrapper`](https://github.com/CosmWasm/cw-multi-test/blob/v2.1.1/src/contracts.rs#L161)
that exposes functions as if they were your smart contract's entry points.

There is neither networking, consensus nor block creation.

In this section, each of your integration test will:

- Mock an underlying app chain.
- Store your smart contract code.
- Deploy a smart contract instance.
- Test something specific on this instance.
- Verify that it happened as per the expectations.

## Dependencies

You start by adding MultiTest as a development dependency to your project:

<Tabs groupId="local-docker">
    <TabItem value="Local" active>
        ```shell
        cargo add --dev cw-multi-test@2.1.1
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add --dev cw-multi-test@2.1.1
        ```
    </TabItem>
</Tabs>

You are going to put your integration tests into a new folder: `tests`. In this folder, create a `contract.rs`
file where you start by adding your dependencies:

```rust title="tests/contract.rs"
use cosmwasm_std::Addr;
use cw_multi_test::{App, ContractWrapper, Executor};
use cw_my_nameservice::{
    contract::{execute, instantiate, query},
    msg::{ExecuteMsg, InstantiateMsg, QueryMsg, ResolveRecordResponse},
};
```

Note that:

- `cw_multi_test::App` mocks an underlying Cosmos app chain.
- `cw_multi_test::ContractWrapper` mocks a compiled smart contract, without actually compiling it to WebAssembly.
- `cw_multi_test::Executor` imports functions that allow you to execute actions on your mocked App.
- You import your smart contract's functions and messages. You may have to rename from `my_nameservice`
  if you picked a different name for your project.

## Preparation

When you mock your underlying app chain, you can choose
[which features](https://docs.cosmwasm.com/cw-multi-test/features) it should implement.
In this case, [the defaults](https://github.com/CosmWasm/cw-multi-test/blob/v2.1.1/src/app.rs#L92-L99) will be enough.
So to mock an App, you simply call:

```rust
let mut mock_app = App::default();
```

Each of your tests will repeat similar steps, namely:

1. Wrap the smart contract functions, to simulate a compilation.
2. Store the code on the mocked app chain.
3. Deploy an instance of your smart contract.

So it is worth creating a function that you can call to do that. Add to `tests/contract.rs`:

```rust title="tests/contract.rs"
fn instantiate_nameservice(mock_app: &mut App) -> (u64, Addr) {
    let nameservice_code = Box::new(ContractWrapper::new(execute, instantiate, query));
    let nameservice_code_id = mock_app.store_code(nameservice_code);
    return (
        nameservice_code_id,
        mock_app
            .instantiate_contract(
                nameservice_code_id,
                Addr::unchecked("deployer"),
                &InstantiateMsg {},
                &[],
                "nameservice",
                None,
            )
            .expect("Failed to instantiate nameservice"),
    );
}
```

Note how:

- Your smart contract is "compiled" into `ContractWrapper`.
- It is then stored on-chain, at a code id.
- The address of the deployer is not important, but could be in future iterations of your smart contract.
- The [`instantiate_contract`](https://github.com/CosmWasm/cw-multi-test/blob/v2.1.1/src/executor.rs#L84)
  function is actually defined in `Executor`.

## Name register test

With this, you can add a test of a name register. You want to make sure that it is saved to storage. Add:

```rust title="tests/contract.rs"
#[test]
fn test_register() {
    // Arrange
    let mut mock_app = App::default();
    let (_, contract_addr) = instantiate_nameservice(&mut mock_app);
    let owner_addr_value = "owner".to_owned();
    let owner_addr = Addr::unchecked(owner_addr_value.clone());
    let name_alice = "alice".to_owned();
    let register_msg = ExecuteMsg::Register {
        name: name_alice.to_owned(),
    };

    // Act
    let result = mock_app.execute_contract(
        owner_addr.clone(),
        contract_addr.clone(),
        &register_msg,
        &[],
    );

    // Assert
    assert!(result.is_ok(), "Failed to register alice");
    let stored_addr_bytes = mock_app
        .contract_storage(&contract_addr)
        .get(format!("\0\rname_resolver{name_alice}").as_bytes())
        .expect("Failed to load from name alice");
    let stored_addr = String::from_utf8(stored_addr_bytes).unwrap();
    assert_eq!(stored_addr, format!(r#"{{"owner":"{owner_addr_value}"}}"#));
}
```

Note that:

- It looks very much like what you did in unit tests.
- The [`execute_contract`](https://github.com/CosmWasm/cw-multi-test/blob/v2.1.1/src/executor.rs#L145)
  is declared in `Executor`.
- You are accessing directly to storage, which is a bit arduous but could come in handy at times,
  instead of relying on the query message. The `"alice"` key is prefixed with the `0` and `\r` bytes
  and the name of the storage map.

<details>
   <summary>If you are unsure about the keys in storage</summary>

You can retrieve them all, as long as there are not too many of them, with:

```rust
let store_dump = mock_app.dump_wasm_raw(&contract_addr);
println!("Length {}. Keys:", store_dump.len());
for (key, _) in store_dump {
    println!("{} / {:?}", str::from_utf8(&key).unwrap(), key);
}
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
Length 1. Keys:
name_resolveralice / [0, 13, 110, 97, 109, 101, 95, 114, 101, 115, 111, 108, 118, 101, 114, 97, 108, 105, 99, 101]
```

The numerical values make it clear that the first two characters are `0` and [`13`](https://www.ascii-code.com/13), i.e. `\r`.

</details>

To confirm that it works, you run the same way you did for unit tests:

<Tabs groupId="local-docker">
    <TabItem value="Local" active>
        ```shell
        cargo test
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo test
        ```
    </TabItem>
</Tabs>

Which should print something like:

```text
...
     Running tests/contract.rs (target/debug/deps/contract-d6161d38a3b0d331)

running 1 test
test test_register ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
...
```

## Name query test

With the name register test in place, you can add another test to confirm that the query works too. Add:

```rust title="tests/contract.rs"
#[test]
fn test_query() {
    // Arrange
    let mut mock_app = App::default();
    let (_, contract_addr) = instantiate_nameservice(&mut mock_app);
    let owner_addr = Addr::unchecked("owner");
    let name_alice = "alice".to_owned();
    let register_msg = ExecuteMsg::Register {
        name: name_alice.to_owned(),
    };
    let _ = mock_app
        .execute_contract(
            owner_addr.clone(),
            contract_addr.clone(),
            &register_msg,
            &[],
        )
        .expect("Failed to register alice");
    let resolve_record_query_msg = QueryMsg::ResolveRecord {
        name: name_alice.to_owned(),
    };

    // Act
    let result = mock_app
        .wrap()
        .query_wasm_smart::<ResolveRecordResponse>(&contract_addr, &resolve_record_query_msg);

    // Assert
    assert!(result.is_ok(), "Failed to query alice name");
    assert_eq!(
        result.unwrap(),
        ResolveRecordResponse {
            address: Some(owner_addr.to_string())
        }
    )
}
```

Note that:

* This time you execute the register command and expect a positive result, instead of checking it with an `assert!`.
* You access the query functions by wrapping the app: [`.wrap()`](https://github.com/CosmWasm/cw-multi-test/blob/v2.1.1/src/app.rs#L433).
* There are a lot of [possible query functions](https://github.com/CosmWasm/cosmwasm/blob/v2.1.3/packages/std/src/traits.rs#L355). So as to handle the fewer de/serialization matters, you can call `query_wasm_smart`.
* [`query_wasm_smart`](https://github.com/CosmWasm/cosmwasm/blob/v2.1.3/packages/std/src/traits.rs#L521) is a function of the mocked app, so it expects you to pass the address of the contract to query.
* You also need to specify the expected `ResolveRecordResponse` type because the compiler cannot otherwise infer it.

Once you run `cargo test` again, you should see:

```shell
...
running 2 tests
test test_register ... ok
test test_query ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
...
```

For good measure, you can add a test that makes sure there are no results when querying on an unregistered name:

```rust title="tests/contract.rs"
#[test]
fn test_query_empty() {
    // Arrange
    let mut mock_app = App::default();
    let (_, contract_addr) = instantiate_nameservice(&mut mock_app);
    let name_alice = "alice".to_owned();
    let resolve_record_query_msg = QueryMsg::ResolveRecord {
        name: name_alice.to_owned(),
    };

    // Act
    let result = mock_app
        .wrap()
        .query_wasm_smart::<ResolveRecordResponse>(&contract_addr, &resolve_record_query_msg);

    // Assert
    assert!(result.is_ok(), "Failed to query alice name");
    assert_eq!(result.unwrap(), ResolveRecordResponse { address: None })
}
```

## Conclusion

You have created your first mocked-app test whereby your smart contract is tested against a mocked CosmWasm module.

:::info Exercise progression

At this stage, you should have something similar to the
[`first-multi-test`](https://github.com/b9lab/cw-my-nameservice/tree/first-multi-test) branch,
with [this](https://github.com/b9lab/cw-my-nameservice/compare/first-query-message..first-multi-test) as the diff.

:::
