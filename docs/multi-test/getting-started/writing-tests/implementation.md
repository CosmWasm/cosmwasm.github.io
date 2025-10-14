---
title: Implementation
sidebar_position: 1
toc_max_heading_level: 4
---

# Writing tests

As a reminder, the file structure of the **[counter]** project is shown below. In this chapter, you
will write tests for this smart contract, which should be placed in a file named `test_counter.rs`,
as highlighted on line 12.

```text title="counter directory" showLineNumbers {12}
.
├── Cargo.toml
├── coverage.sh
├── src
│   ├── contract.rs
│   ├── lib.rs
│   └── msg.rs
└── tests
    ├── mod.rs
    └── multitest
        ├── mod.rs
        └── test_counter.rs
```

:::tip

If you're in a hurry, you can find the [final version](#test-cases-put-all-together)
of the `test_counter.rs` file at the end of this chapter.

:::

## Imports

At the beginning of the `test_counter.rs` file, the necessary imports for implementing all test
cases are included.

The `cosmwasm_std` library is used to import only the `Empty` type, which serves as a placeholder
for messages that do not carry any additional data.

Additionally, all message types from the counter smart contract are imported. These include
initialization (`CounterInitMsg`), execution (`CounterExecMsg`), and query
(`CounterQueryMsg`) messages, as well as the query response (`CounterResponse`), which
are essential for interacting with and verifying the state of the contract during testing.

Finally, basic utilities from **MultiTest** (the [cw-multi-test] crate) are imported. These tools
allow you to set up a blockchain simulator, execute contract messages and test interactions.

Just copy and paste the code presented below to your `test_counter.rs` file:

```rust title="test_counter.rs" showLineNumbers=1
use cosmwasm_std::Empty;
use counter::msg::{CounterExecMsg, CounterInitMsg, CounterQueryMsg, CounterResponse};
use cw_multi_test::{App, Contract, ContractWrapper, Executor, IntoAddr};
```

## Wrapping the contract

```rust title="test_counter.rs" showLineNumbers=5
fn counter_contract() -> Box<dyn Contract<Empty>> {
    Box::new(ContractWrapper::new_with_empty(
        counter::contract::execute,
        counter::contract::instantiate,
        counter::contract::query,
    ))
}
```

The function `counter_contract` presented above is a boilerplate that wraps the contract's entry
points (`instantiate`, `execute` and `query`) in a standard way, making the contract compatible with
the `Contract` trait. This allows it to be easily stored or interacted with in a **MultiTest**
blockchain simulation environment. Whenever you want to test your smart contract using
**MultiTest**, the first step is to wrap it in this manner.

## Testing counter initialization

### Testing initialization with zero

This first test verifies that the counter contract can be instantiated with an initial value of zero
using the `CounterInitMsg::Zero` message. It ensures that the contract correctly stores the
initial value and that the query mechanism returns the expected counter value. It exemplifies a
well-structured test with clear setup, execution, and validation steps.

```rust title="test_counter.rs" showLineNumbers=13 {13,25}
#[test]
fn instantiating_with_zero_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner,
            &CounterInitMsg::Zero,
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(0, res.value);
}
```

Let's take a closer look at the flow of this test:

#### ① Chain initialization
 
Creating an instance of the `App` simulates running a blockchain. There are multiple ways to
instantiate the `App`, but the simplest method, shown below, uses the `default` function.

```rust title="test_counter.rs" showLineNumbers=15
let mut app = App::default();
```

#### ② Storing contract on chain

The next step is to store the contract code on the chain. The `App` provides a
`store_code` function for this purpose. Instead of a WASM binary, as in a real blockchain, a
wrapped contract is passed to this function. `store_code` returns the identifier of the
contract code assigned to `code_id`. This `code_id` is used to reference the stored
contract code later in test.

```rust title="test_counter.rs" showLineNumbers=17
let code_id = app.store_code(counter_contract());
```

#### ③ Defining the contract owner

Every instance of the contract has an owner represented as an address. In this test the string
`"owner"` is converted to Bech32 address recognized by the blockchain.

```rust title="test_counter.rs" showLineNumbers=19
let owner = "owner".into_addr();
```

#### ④ Contract instantiation

The contract is instantiated using `instantiate_contract` provided by `App` with the
following parameters:

- **`code_id`** the identifier for the stored contract code,
- **`owner`** the owner address of the contract instance,
- **`&CounterInitMsg::Zero`** initialization message, that sets the counter's initial value
  to zero,
- **`&[]`** no funds are sent to the contract during initialization,
- **`"counter-label"`** a label for the contract instance,
- **`None`** no admin permissions.

The `unwrap()` function is used to handle the result of instantiating the contract, ensuring
the test fails if an error occurs. `instantiate_contract` function returns the address of the
contract instance referenced later in this test.

```rust title="test_counter.rs" showLineNumbers=21
let contract_addr = app
    .instantiate_contract(
        code_id,
        owner,
        &CounterInitMsg::Zero,
        &[],
        "counter-label",
        None,
  )
  .unwrap();
```

#### ⑤ Querying the contract

After the contract is instantiated, this test queries it, using `query_wasm_smart` function with
a message `CounterQueryMsg::Value`, which is expected to return the current value of the counter.
The result is unwrapped into a `CounterResponse` object. The instance of the contract that is queried
depends on the address obtained during instantiation in the previous step.

```rust title="test_counter.rs" showLineNumbers=32
let res: CounterResponse = app
    .wrap()
    .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
    .unwrap();
```

#### ⑥ Asserting the expected value

The final step of this test asserts that the value returned by the contract is `0`. If the
value is not zero, the test will fail.

```rust title="test_counter.rs" showLineNumbers=37
assert_eq!(0, res.value);
```

#### Running tests

Now it's time to execute the first test:

```shell copy title="terminal"
cargo test
```

The expected output should look like the example shown below. Note that only the results of
integration tests are shown. For brevity, the results of unit tests and documentation tests are
omitted, as we are focusing only on integration tests in this example.

```text title="output"
     Running tests/mod.rs (target/debug/deps/mod-319eb78408f3e46f)

running 1 test
test multitest::test_counter::instantiating_with_zero_should_work ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

Now, let's run all tests with [cargo-nextest]:

```shell copy title="terminal"
cargo nextest run
```

Similarly, one test passes:

```text title="output"
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.06s
    Starting 1 test across 2 binaries (run ID: bfc0013c-eb8e-447c-8027-a7c2b8c5cb80, nextest profile: default)
        PASS [   0.005s] counter::mod multitest::test_counter::instantiating_with_zero_should_work
------------
     Summary [   0.005s] 1 test run: 1 passed, 0 skipped
```

:::info

For brevity, in the upcoming test cases in this chapter, we will skip running tests using
[cargo-nextest]. However, you can always run all tests by typing `cargo nextest run`.

:::

#### Code coverage

Let's check the code coverage after adding the first test:

```shell copy title="terminal"
./coverage.sh
```

```text title="output"
|| Tested/Total Lines:
|| src/contract.rs: 10/18
||
55.56% coverage, 10/18 lines covered
```

Our first test case covered over 50% of the code in the **[counter]** smart contract.
The detailed code coverage report (similar to the one generated by Tarpaulin) is attached below.

```text title="code coverage report" showLineNumbers
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use crate::msg::{CounterExecMsg, CounterInitMsg, CounterQueryMsg, CounterResponse};
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError};
use cw_storage_plus::Item;

const COUNTER: Item<u8> = Item::new("value");

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterInitMsg,
) -> Result<Response, StdError> {
//with-coverage-start
    COUNTER.save(
        deps.storage,
        &match msg {
            CounterInitMsg::Zero => 0,
//with-coverage-end
//no-coverage            
            CounterInitMsg::Set(new_value) => new_value,
        },
    )?;
//with-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//no-coverage
pub fn execute(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterExecMsg,
) -> Result<Response, StdError> {
//no-coverage-start
    COUNTER.update::<_, StdError>(deps.storage, |old_value| {
        Ok(match msg {
            CounterExecMsg::Inc => old_value.saturating_add(1),
            CounterExecMsg::Dec => old_value.saturating_sub(1),
            CounterExecMsg::Set(new_value) => new_value,
//no-coverage-end            
        })
    })?;
//no-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage-start
pub fn query(deps: Deps, _env: Env, msg: CounterQueryMsg) -> Result<Binary, StdError> {
    match msg {
        CounterQueryMsg::Value => Ok(to_json_binary(&CounterResponse {
            value: COUNTER.may_load(deps.storage)?.unwrap(),
//with-coverage-end
        })?),
    }
}
```

The code coverage report reflects exactly the scope of the first test. The `instantiate` and `query`
entry-points of the contract were called. There is one more message variant (line 21) to be tested
during contract instantiation and this will be covered in the next test. The `execute` entry-point
was not called in test and still <span style={{color:'red'}}>shines red</span> in this report.

### Testing initialization with a specific value

The second test verifies the initialization of the **[counter]** contract using a specific value that
must be in range 0‥255, let say **12**. It's done using `CounterInitMsg::Set` message.

```rust title="test_counter.rs" showLineNumbers=40 {13,25}
#[test]
fn instantiating_with_value_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner,
            &CounterInitMsg::Set(12),
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(12, res.value);
}
```

Except for the message used to instantiate the contract and the value assertion, all steps in this
test are the same as in the previous one, but let's summarize them shortly:


#### ① Chain initialization

The `App` is created using the `default` function.

```rust title="test_counter.rs" showLineNumbers=42
let mut app = App::default();
```

#### ② Storing contract on chain

Contract code is stored on chain using `store_code` function provided by `App`.
`code_id` is saved for later use.

```rust title="test_counter.rs" showLineNumbers=44
let code_id = app.store_code(counter_contract());
```

#### ③ Defining the contract owner

The `owner` variable is assigned an address of the contract instance's owner.

```rust title="test_counter.rs" showLineNumbers=46
let owner = "owner".into_addr();
```

#### ④ Contract instantiation

This time the contract is instantiated using `CounterInitMsg::Set` message passed to
`instantiate_contract` function provided by `App`:

- **`code_id`** the identifier for the stored contract code,
- **`owner`** the owner address of the contract instance,
- **`&CounterInitMsg::Set(12)`** initialization message, that sets the counter's initial
  value to **12**,
- **`&[]`** no funds are sent to the contract during initialization,
- **`"counter-label"`** a label for the contract instance,
- **`None`** no admin permissions.

```rust title="test_counter.rs" showLineNumbers=48
let contract_addr = app
    .instantiate_contract(
      code_id,
      owner,
      &CounterInitMsg::Set(12),
      &[],
      "counter-label",
      None,
    )
    .unwrap();
```

#### ⑤ Querying the contract

Like in the previous test the contract is queried to retrieve the current value of the counter.

```rust title="test_counter.rs" showLineNumbers=59
let res: CounterResponse = app
    .wrap()
    .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
    .unwrap();
```

#### ⑥ Asserting the value

The expected value of the counter should be **12**.

```rust title="test_counter.rs" showLineNumbers=64
assert_eq!(12, res.value);
```

#### Running tests

To execute all test type in terminal:

```shell copy title="terminal"
cargo test
```

The expected output should be similar to the one shown below, with both tests passing.

```text title="output"
     Running tests/mod.rs (target/debug/deps/mod-319eb78408f3e46f)

running 2 tests
test multitest::test_counter::instantiating_with_zero_should_work ... ok
test multitest::test_counter::instantiating_with_value_should_work ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

#### Code coverage

To make sure that the entire `instantiate` entrypoint is tested, let's run the code coverage:

```shell copy title="terminal"
./coverage.sh
```

```text title="output"
|| Tested/Total Lines:
|| src/contract.rs: 11/18
||
61.11% coverage, 11/18 lines covered
```

The detailed code coverage report (similar to the one generated by Tarpaulin) is shown below:

```text title="code coverage report" showLineNumbers
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use crate::msg::{CounterExecMsg, CounterInitMsg, CounterQueryMsg, CounterResponse};
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError};
use cw_storage_plus::Item;

const COUNTER: Item<u8> = Item::new("value");

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterInitMsg,
) -> Result<Response, StdError> {
//with-coverage-start
    COUNTER.save(
        deps.storage,
        &match msg {
            CounterInitMsg::Zero => 0,
            CounterInitMsg::Set(new_value) => new_value,
//with-coverage-end            
        },
    )?;
//with-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//no-coverage
pub fn execute(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterExecMsg,
) -> Result<Response, StdError> {
//no-coverage-start
    COUNTER.update::<_, StdError>(deps.storage, |old_value| {
        Ok(match msg {
            CounterExecMsg::Inc => old_value.saturating_add(1),
            CounterExecMsg::Dec => old_value.saturating_sub(1),
            CounterExecMsg::Set(new_value) => new_value,
//no-coverage-end            
        })
    })?;
//no-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage-start
pub fn query(deps: Deps, _env: Env, msg: CounterQueryMsg) -> Result<Binary, StdError> {
    match msg {
        CounterQueryMsg::Value => Ok(to_json_binary(&CounterResponse {
            value: COUNTER.may_load(deps.storage)?.unwrap(),
//with-coverage-end
        })?),
    }
}
```

As expected, the `instantiate` entry-point is fully tested, including all accepted initialization
messages. However, the `execute` entrypoint still <span style={{color:'red'}}>shines red</span>.
Let's address that in the next test.

## Testing counter increment

### Testing increment by 1

In this test, the contract is instantiated with an initial value of zero, similar to the first test.
However, this time, an increment action is performed by invoking the contract's `execute`
entry-point with the `CounterExecMsg::Inc` message. This action is expected to increment the
counter by `1`. Finally, the counter's value is queried to confirm that it has been correctly
incremented and now holds the value `1`.

```rust title="test_counter.rs" showLineNumbers=67 {13,20-21,28} 
#[test]
fn incrementing_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Zero,
            &[],
            "counter-contract",
            None,
        )
        .unwrap();

    app.execute_contract(owner, contract_addr.clone(), &CounterExecMsg::Inc, &[])
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(1, res.value);
}
```

You should already be familiar with the flow of this test; the only difference from the previous
examples is the additional step of invoking the `execute` entrypoint.

#### ① Executing the increment action

```rust title="test_counter.rs" showLineNumbers=86
app.execute_contract(owner, contract_addr.clone(), &CounterActionMsg::Inc, &[])
    .unwrap();
```

The `execute` entry-point of the contract is evaluated by calling the `execute_contract`
function provided by `App` with the following arguments:

- **`owner`** the owner address of the contract instance,
- **`contract_addr`** address of the contract instance the message will be executed on,
- **`&CounterExecMsg::Inc`** message to be executed, that increments the counter's value by
  1,
- **`&[]`** no funds are sent to the contract during message execution.



#### Running tests

Let's execute all tests by typing in the terminal:

```shell copy title="terminal"
cargo test
```

All 3 tests should pass:

```text title="output"
     Running tests/mod.rs (target/debug/deps/mod-319eb78408f3e46f)

running 3 tests
test multitest::test_counter::instantiating_with_zero_should_work ... ok
test multitest::test_counter::instantiating_with_value_should_work ... ok
test multitest::test_counter::incrementing_should_work ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

#### Code coverage

Like in the previous examples let's run the code coverage script:

```shell copy copy title="terminal"
./coverage.sh
```

```text title="output"
|| Tested/Total Lines:
|| src/contract.rs: 16/18
||
88.89% coverage, 16/18 lines covered
```

The code coverage report (similar to the one generated by Tarpaulin):

```text title="code coverage report" showLineNumbers
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use crate::msg::{CounterExecMsg, CounterInitMsg, CounterQueryMsg, CounterResponse};
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError};
use cw_storage_plus::Item;

const COUNTER: Item<u8> = Item::new("value");

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterInitMsg,
) -> Result<Response, StdError> {
//with-coverage-start
    COUNTER.save(
        deps.storage,
        &match msg {
            CounterInitMsg::Zero => 0,
            CounterInitMsg::Set(new_value) => new_value,
//with-coverage-end            
        },
    )?;
//with-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage
pub fn execute(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterExecMsg,
) -> Result<Response, StdError> {
//with-coverage-start
    COUNTER.update::<_, StdError>(deps.storage, |old_value| {
        Ok(match msg {
            CounterExecMsg::Inc => old_value.saturating_add(1),
//with-coverage-end
//no-coverage-start            
            CounterExecMsg::Dec => old_value.saturating_sub(1),
            CounterExecMsg::Set(new_value) => new_value,
//no-coverage-end            
        })
    })?;
//with-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage-start
pub fn query(deps: Deps, _env: Env, msg: CounterQueryMsg) -> Result<Binary, StdError> {
    match msg {
        CounterQueryMsg::Value => Ok(to_json_binary(&CounterResponse {
            value: COUNTER.may_load(deps.storage)?.unwrap(),
//with-coverage-end
        })?),
    }
}
```

As expected, the `execute` entrypoint of the smart contract was called, and the
`CounterExecMsg::Inc` message was processed. Notice that there are two additional message
variants that still need to be tested for this entrypoint. However, before that, let's address the
issue of the counter overflow during incrementation.

### Testing increment overflow

When you recall the **[counter]** smart contract specification, you will notice that the counter value
is of type `u8`, which means that the maximum value this counter can hold is 255. What happens when
you increment the counter beyond 255? The following test initializes the counter with value 250 and
then increments it 10 times by calling the `execute` entrypoint.

```rust title="test_counter.rs" showLineNumbers=97 {13,20-28,35}
#[test]
fn incrementing_should_stop_at_maximum() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Set(250),
            &[],
            "counter",
            None,
        )
        .unwrap();

    for _ in 1..=10 {
        app.execute_contract(
            owner.clone(),
            contract_addr.clone(),
            &CounterExecMsg::Inc,
            &[],
        )
        .unwrap();
    }

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(255, res.value);
}
```

In the highlighted lines 116 to 124, the loop is executed 10 times, after which the counter value is
queried and asserted to be 255. As you will see, this test will pass, indicating that the counter
stops incrementing once it reaches 255. This happens because the counter is incremented using the
`saturating_add` function on the `u8` type.

As an exercise, modify this test by initializing the counter to zero and incrementing it, let say, 1000
times. This will demonstrate how quick and simple it is to test boundary values on constrained types
using **MultiTest**.

#### Running tests

Make sure all tests pass:

```shell copy title="terminal"
cargo test
```

```text title="output"
     Running tests/mod.rs (target/debug/deps/mod-319eb78408f3e46f)

running 4 tests
test multitest::test_counter::instantiating_with_zero_should_work ... ok
test multitest::test_counter::instantiating_with_value_should_work ... ok
test multitest::test_counter::incrementing_should_work ... ok
test multitest::test_counter::incrementing_should_stop_at_maximum ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

#### Code coverage

```shell copy title="terminal"
./coverage.sh
```

```text title="output"
|| Tested/Total Lines:
|| src/contract.rs: 16/18
||
88.89% coverage, 16/18 lines covered
```

The code coverage did not change after adding this test, but a very important use case was tested:
**handling overflow during counter incrementation**.

## Testing counter decrement

### Testing decrement by 1

One of the message variants for the `execute` entry-point that hasn't been tested yet is
`CounterExecMsg::Dec`. The following test is similar to the one you wrote for testing counter
incrementation, with changes in the highlighted lines:

```rust title="test_counter.rs" showLineNumbers=134 {13,20-21,28}
#[test]
fn decrementing_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Set(126),
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    app.execute_contract(owner, contract_addr.clone(), &CounterExecMsg::Dec, &[])
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(125, res.value);
}
```

In line 146 the counter smart contract is initialized with the value 126, then in line 153 it is
decremented and in line 161 it is asserted that the final value of the counter is 125.

#### Running tests

The only way to confirm that the counter is properly decremented is by running all the tests:

```shell copy title="terminal"
cargo test
```

```text title="output"
     Running tests/mod.rs (target/debug/deps/mod-319eb78408f3e46f)

running 5 tests
test multitest::test_counter::instantiating_with_zero_should_work ... ok
test multitest::test_counter::instantiating_with_value_should_work ... ok
test multitest::test_counter::incrementing_should_work ... ok
test multitest::test_counter::incrementing_should_stop_at_maximum ... ok
test multitest::test_counter::decrementing_should_work ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

#### Code coverage

Run the code coverage script:

```shell copy title="terminal"
./coverage.sh
```

```text title="output"
|| Tested/Total Lines:
|| src/contract.rs: 17/18
||
94.44% coverage, 17/18 lines covered
```

Check the code coverage report:

```text title="code coverage report" showLineNumbers
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use crate::msg::{CounterExecMsg, CounterInitMsg, CounterQueryMsg, CounterResponse};
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError};
use cw_storage_plus::Item;

const COUNTER: Item<u8> = Item::new("value");

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterInitMsg,
) -> Result<Response, StdError> {
//with-coverage-start
    COUNTER.save(
        deps.storage,
        &match msg {
            CounterInitMsg::Zero => 0,
            CounterInitMsg::Set(new_value) => new_value,
//with-coverage-end            
        },
    )?;
//with-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage
pub fn execute(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterExecMsg,
) -> Result<Response, StdError> {
//with-coverage-start
    COUNTER.update::<_, StdError>(deps.storage, |old_value| {
        Ok(match msg {
            CounterExecMsg::Inc => old_value.saturating_add(1),
            CounterExecMsg::Dec => old_value.saturating_sub(1),
//with-coverage-end
//no-coverage-start            
            CounterExecMsg::Set(new_value) => new_value,
//no-coverage-end            
        })
    })?;
//with-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage-start
pub fn query(deps: Deps, _env: Env, msg: CounterQueryMsg) -> Result<Binary, StdError> {
    match msg {
        CounterQueryMsg::Value => Ok(to_json_binary(&CounterResponse {
            value: COUNTER.may_load(deps.storage)?.unwrap(),
//with-coverage-end
        })?),
    }
}
```

As expected, processing the `CounterExecMsg::Dec` message is already tested.

### Testing decrement underflow

Similar to the incrementation overflow test, the following test checks for underflow during counter
decrementation. The counter is initialized to 5, decremented 10 times, and the final value is
asserted to be 0. This test passes without errors because the `u8` type in the smart contract is
decremented using the `saturating_sub` function.

```rust title="test_counter.rs" showLineNumbers=164 {13,20-28,35} 
#[test]
fn decrementing_should_stop_at_minimum() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Set(5),
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    for _ in 1..=10 {
        app.execute_contract(
            owner.clone(),
            contract_addr.clone(),
            &CounterExecMsg::Dec,
            &[],
        )
        .unwrap();
    }

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(0, res.value);
}
```

#### Running tests

Like in previous examples, let's run all tests:

```shell copy title="terminal"
cargo test
```

All tests should pass:

```text title="output"
     Running tests/mod.rs (target/debug/deps/mod-319eb78408f3e46f)

running 6 tests
test multitest::test_counter::instantiating_with_zero_should_work ... ok
test multitest::test_counter::instantiating_with_value_should_work ... ok
test multitest::test_counter::incrementing_should_work ... ok
test multitest::test_counter::incrementing_should_stop_at_maximum ... ok
test multitest::test_counter::decrementing_should_work ... ok
test multitest::test_counter::decrementing_should_stop_at_minimum ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

#### Code coverage

Run the code coverage script:

```shell copy title="terminal"
./coverage.sh
```

```text title="output"
|| Tested/Total Lines:
|| src/contract.rs: 17/18
||
94.44% coverage, 17/18 lines covered
```

The code coverage did not change after adding this test case, but a very important use case was tested:
**handling underflow during counter decrementation**.

## Testing counter value changes

The last red line in the test coverage report highlights the `CounterExecMsg::Set` message in
the `execute` entry-point. The test below sets the counter directly to `126` using the
`CounterExecMsg::Set(126)` message. The final value of the counter is then asserted to be `126`.

```rust title="test_counter.rs" showLineNumbers=201 {13,20-21,28}
#[test]
fn setting_value_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Set(5),
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    app.execute_contract(owner, contract_addr.clone(), &CounterExecMsg::Set(126), &[])
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(126, res.value);
}
```

#### Running tests

Let’s run the final tests:

```shell copy title="terminal"
cargo test
```

All tests should pass:

```text title="output"
     Running tests/mod.rs (target/debug/deps/mod-319eb78408f3e46f)

running 7 tests
test multitest::test_counter::instantiating_with_zero_should_work ... ok
test multitest::test_counter::instantiating_with_value_should_work ... ok
test multitest::test_counter::incrementing_should_work ... ok
test multitest::test_counter::incrementing_should_stop_at_maximum ... ok
test multitest::test_counter::decrementing_should_work ... ok
test multitest::test_counter::decrementing_should_stop_at_minimum ... ok
test multitest::test_counter::setting_value_should_work ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
```

#### Code coverage

Let's create the final code coverage report:

```shell copy title="terminal"
./coverage.sh
```

```text title="output"
|| Tested/Total Lines:
|| src/contract.rs: 18/18
||
100.00% coverage, 18/18 lines covered
```

Nice, you have reached 💯 percent code coverage!

```text title="code coverage report" showLineNumbers
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;

use crate::msg::{CounterExecMsg, CounterInitMsg, CounterQueryMsg, CounterResponse};
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError};
use cw_storage_plus::Item;

const COUNTER: Item<u8> = Item::new("value");

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterInitMsg,
) -> Result<Response, StdError> {
//with-coverage-start
    COUNTER.save(
        deps.storage,
        &match msg {
            CounterInitMsg::Zero => 0,
            CounterInitMsg::Set(new_value) => new_value,
//with-coverage-end            
        },
    )?;
//with-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage
pub fn execute(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: CounterExecMsg,
) -> Result<Response, StdError> {
//with-coverage-start
    COUNTER.update::<_, StdError>(deps.storage, |old_value| {
        Ok(match msg {
            CounterExecMsg::Inc => old_value.saturating_add(1),
            CounterExecMsg::Dec => old_value.saturating_sub(1),
            CounterExecMsg::Set(new_value) => new_value,
//with-coverage-end            
        })
    })?;
//with-coverage    
    Ok(Response::default())
}

#[cfg_attr(not(feature = "library"), entry_point)]
//with-coverage-start
pub fn query(deps: Deps, _env: Env, msg: CounterQueryMsg) -> Result<Binary, StdError> {
    match msg {
        CounterQueryMsg::Value => Ok(to_json_binary(&CounterResponse {
            value: COUNTER.may_load(deps.storage)?.unwrap(),
//with-coverage-end
        })?),
    }
}
```

All functionalities of the **[counter]** smart contract have been tested, the code coverage report
<span style={{color:'green'}}>shines green</span>.

## Test cases put all together

Below is the final version of the `test_counter.rs` file, containing all previously presented test
cases for the **[counter]** smart contract.

```rust copy showLineNumbers title="test_counter.rs"
use cosmwasm_std::Empty;
use counter::msg::{CounterExecMsg, CounterInitMsg, CounterQueryMsg, CounterResponse};
use cw_multi_test::{App, Contract, ContractWrapper, Executor, IntoAddr};

fn counter_contract() -> Box<dyn Contract<Empty>> {
    Box::new(ContractWrapper::new_with_empty(
        counter::contract::execute,
        counter::contract::instantiate,
        counter::contract::query,
    ))
}

#[test]
fn instantiating_with_zero_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner,
            &CounterInitMsg::Zero,
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(0, res.value);
}

#[test]
fn instantiating_with_value_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner,
            &CounterInitMsg::Set(12),
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(12, res.value);
}

#[test]
fn incrementing_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Zero,
            &[],
            "counter-contract",
            None,
        )
        .unwrap();

    app.execute_contract(owner, contract_addr.clone(), &CounterExecMsg::Inc, &[])
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(1, res.value);
}

#[test]
fn incrementing_should_stop_at_maximum() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Set(250),
            &[],
            "counter",
            None,
        )
        .unwrap();

    for _ in 1..=10 {
        app.execute_contract(
            owner.clone(),
            contract_addr.clone(),
            &CounterExecMsg::Inc,
            &[],
        )
        .unwrap();
    }

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(255, res.value);
}

#[test]
fn decrementing_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Set(126),
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    app.execute_contract(owner, contract_addr.clone(), &CounterExecMsg::Dec, &[])
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(125, res.value);
}

#[test]
fn decrementing_should_stop_at_minimum() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Set(5),
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    for _ in 1..=10 {
        app.execute_contract(
            owner.clone(),
            contract_addr.clone(),
            &CounterExecMsg::Dec,
            &[],
        )
        .unwrap();
    }

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(0, res.value);
}

#[test]
fn setting_value_should_work() {
    let mut app = App::default();

    let code_id = app.store_code(counter_contract());

    let owner = "owner".into_addr();

    let contract_addr = app
        .instantiate_contract(
            code_id,
            owner.clone(),
            &CounterInitMsg::Set(5),
            &[],
            "counter-label",
            None,
        )
        .unwrap();

    app.execute_contract(owner, contract_addr.clone(), &CounterExecMsg::Set(126), &[])
        .unwrap();

    let res: CounterResponse = app
        .wrap()
        .query_wasm_smart(contract_addr, &CounterQueryMsg::Value)
        .unwrap();

    assert_eq!(126, res.value);
}
```

## General test structure

To summarize the process of writing tests using **MultiTest**, let’s review the general structure of a test.
High-quality tests typically follow a series of common steps to ensure thorough validation and reliability.
By adhering to these structured steps, you can create maintainable and robust test suites that effectively
validate your CosmWasm smart contracts:

### ① Initialize the chain

🖝 Set up the blockchain simulator for testing.

### ② Store contract(s) on chain

🖝 Upload the contract(s) code to the chain.

### ③ Instantiate contract(s)

🖝 Instantiate contract(s) with the desired initial state.

### ④ Interact with contract(s)

🖝 Perform actions such as queries and executes on instantiated contract(s).

### ⑤ Assert expected results

🖝 Verify the outcomes against expected values to confirm correct behavior.

## Summary

In this chapter, you learned how to prepare (wrap) a smart contract for testing with **MultiTest**,
how to structure effective test cases, and how to measure your testing progress using code coverage reports.
You also became familiar with the **`cargo test`** tool. Now, you’re ready to write tests for your own smart contracts!

[cargo-nextest]: https://nexte.st
[cw-multi-test]: https://crates.io/crates/cw-multi-test
[counter]: ../counter/introduction.md
