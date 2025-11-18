---
title: First contract
description: Write your first smart contract
---

# First contract

In the hello world, you used an already-made smart contract that implements a name service. It is a [rudimentary one](https://github.com/deus-labs/cw-contracts/blob/v0.11.0/contracts/nameservice/src/contract.rs). This somewhat longer-running exercise intends to build progressively a better nameservice, which could be [this one](https://github.com/public-awesome/names/blob/v1.2.8/contracts/name-minter/src/contract.rs), from the ground up.

<HighlightBox type="info" title="Exercise progression">

In practice, you will progressively build [this name service](https://github.com/b9lab/cw-my-nameservice). The exercise is built such that you can skip ahead by switching to the appropriate [branch](https://github.com/b9lab/cw-my-nameservice/branches) as mentioned at the top of the page of each exercise section.

</HighlightBox>

It offers two tracks, one local and the other with Docker, so that you can postpone installing the prerequisites.

It was built with Rust 1.80.1 for CosmWasm 2.1.3. It may work with other versions, but breaking changes happen.

## The Rust project

Most likely, you will start your CosmWasm project as a Rust project. Use `cargo` to initialize a new one.

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        cargo new my-nameservice --lib --edition 2021
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        ```sh
        docker run --rm --interactive --tty \
            --volume $(pwd):/root/ --workdir /root \
            rust:1.80.1 \
            cargo new my-nameservice --lib --edition 2021
        ```
    </TabGroupItem>
</TabGroup>

Move into the project directory.

```sh
cd my-nameservice
```

<HighlightBox type="info" title="Exercise progression">

At this stage, you should have something similar to the [`initial-cargo`](https://github.com/b9lab/cw-my-nameservice/tree/initial-cargo) branch.

</HighlightBox>

If you are using VisualStudio Code, feel free to copy the `.vscode` content you see [here]((https://github.com/b9lab/cw-my-nameservice/tree/initial-cargo).

## The instantiation message

With the base project ready, you can move to your first message. Your smart contract will be instantiated, and the `instantiate` function needs a message. Create it in a new `src/msg.rs` file:

<CodeBlock title="src/msg.rs">
```rust
use cosmwasm_schema::cw_serde;

#[cw_serde]
pub struct InstantiateMsg {}
```
</CodeBlock>

You use the attribute macro [`cw_serde`](https://docs.cosmwasm.com/core/entrypoints#defining-your-own-messages) in order to make your for-now-empty _instantiate_ message serializable. Make its content available to the Rust project by replacing the sample code in `src/lib.rs` with:

<CodeBlock title="src/lib.rs">
    ```diff-rs
    + pub mod msg;
    - pub fn add(left: u64, right: u64) -> u64 {
    -     left + right
    - }
    - 
    - #[cfg(test)]
    - mod tests {
    -     ...
    - }
    ```
</CodeBlock>

Note that it says `pub` as the message needs to be known outside of the project, including tests.

Back in `src/msg.rs` you will notice that `cosmwasm_schema` now appears as an `unresolved import`. You see the same message if you try to build:

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        cargo build
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        ```sh
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo build
        ```
    </TabGroupItem>
</TabGroup>

Returns:

```txt
error[E0432]: unresolved import `cosmwasm_schema`
 --> src/msg.rs:1:5
  |
1 | use cosmwasm_schema::cw_serde;
  |     ^^^^^^^^^^^^^^^ use of undeclared crate or module `cosmwasm_schema`
```

Indeed, you need to add the relevant dependency:

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        cargo add cosmwasm-schema@2.1.3
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        ```sh
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add cosmwasm-schema@2.1.3
        ```
    </TabGroupItem>
</TabGroup>

<HighlightBox type="info" title="Exercise progression">

At this stage, you should have something similar to the [`instantiation-message`](https://github.com/b9lab/cw-my-nameservice/tree/instantiation-message) branch, with [this](https://github.com/b9lab/cw-my-nameservice/compare/initial-cargo..instantiation-message) as the diff.

</HighlightBox>

## The instantiation function

With the message declared, you can move on to the function that will instantiate your smart contract.

Create a new file `src/contract.rs` with:

<CodeBlock title="src/contract.rs">
    ```rust
    use crate::msg::InstantiateMsg;
    use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response, StdError};

    #[cfg_attr(not(feature = "library"), entry_point)]
    pub fn instantiate(
        _: DepsMut,
        _: Env,
        _: MessageInfo,
        _: InstantiateMsg,
    ) -> Result<Response, StdError> {
        Ok(Response::default())
    }
    ```
</CodeBlock>

Note how:

* It does not do much beyond returning a default `Ok` response.
* The `#[entry_point]` attribute macro marks the function as a public contract function.
* It is [a convention](https://docs.cosmwasm.com/core/conventions/library-feature) to make it conditional on not being a library, to facilitate reuse.
* The instantiation usage is inferred by the name `instantiate` of this function, which matters.
* The order and types of the parameters matter and need to match exactly. Their names do not.
* It gets a [`DepsMut`](https://docs.cosmwasm.com/core/entrypoints#depsdepsmut), which is a mutable dependency that gives read&write access to storage. This makes sense as the constructor may need to write to storage.
* The return type also matters.

Also make it available to the Rust project by adding the following line to `src/lib.rs`:

<CodeBlock title="src/lib.rs">
    ```diff-rs
    + pub mod contract;
    pub mod msg;
    ```
</CodeBlock>

The module is also marked as public because the CosmWasm system needs to be able to call its function(s).

Once again, there is a missing dependency: `cosmwasm_std`. Add it:

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        cargo add cosmwasm-std@2.1.3
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        ```sh
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add cosmwasm-std@2.1.3
        ```
    </TabGroupItem>
</TabGroup>

<HighlightBox type="info" title="Exercise progression">

At this stage, you should have something similar to the [`instantiation-function`](https://github.com/b9lab/cw-my-nameservice/tree/instantiation-function) branch, with [this](https://github.com/b9lab/cw-my-nameservice/compare/instantiation-message..instantiation-function) as the diff.

</HighlightBox>

## Improve error reporting

With a view to improving error reporting as you progress, you introduce your own error type. In a new `src/error.rs`, add:

<CodeBlock title="src/error.rs">
    ```rust
    use cosmwasm_std::StdError;
    use thiserror::Error;

    #[derive(Error, Debug)]
    pub enum ContractError {
        #[error("{0}")]
        Std(#[from] StdError),
    }
    ```
</CodeBlock>

Note that it uses the popular [thiserror package](https://docs.rs/thiserror/latest/thiserror). Again, add the following line to `src/lib.rs`.

<CodeBlock title="src/lib.rs">
    ```diff-rs
    pub mod contract;
    + mod error;
    pub mod msg;
    ```
</CodeBlock>

Note that it is not `pub` as it only needs to be available within the Rust library project.

And don't forget to add the corresponding dependency:

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        cargo add thiserror@1.0.63
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        ```sh
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo add thiserror@1.0.63
        ```
    </TabGroupItem>
</TabGroup>

Now that the new error type has been declared, you can use it in `src/contract.rs`:

<CodeBlock title="src/contract.rs">
    ```diff-rs
    - use crate::msg::InstantiateMsg;
    - use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response, StdError};
    + use crate::{error::ContractError, msg::InstantiateMsg};
    + use cosmwasm_std::{entry_point, DepsMut, Env, MessageInfo, Response};
    + 
    + type ContractResult = Result<Response, ContractError>;

    #[cfg_attr(not(feature = "library"), entry_point)]
    pub fn instantiate(
        ...
    - ) -> Result<Response, StdError> {
    + ) -> ContractResult {
        ...
    }
    ```
</CodeBlock>

Note how:

* It uses the new error type in a new alias type for the oft-used `Result<Response, ContractError>` type.
* It uses the new type as the return of the `instantiate` function.

<HighlightBox type="info" title="Exercise progression">

At this stage, you should have something similar to the [`improve-error-reporting`](https://github.com/b9lab/cw-my-nameservice/tree/improve-error-reporting) branch, with [this](https://github.com/b9lab/cw-my-nameservice/compare/instantiation-function..improve-error-reporting) as the diff.

</HighlightBox>

## Compilation to WebAssembly

You can already build with the `cargo build` command. How about building to WebAssembly? You need to add the WebAssembly compiling target for that, if it was not yet installed.

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        rustup target add wasm32-unknown-unknown
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        To avoid downloading the `wasm32` target every time, it is good to create a new Docker image that includes it. Create a new file `builder.dockerfile`:

        <CodeBlock title="builder.dockerfile">
        ```Dockerfile
        FROM rust:1.80.1

        RUN rustup target add wasm32-unknown-unknown
        ```
        </CodeBlock>

        And build the image to be named `rust-cosmwasm:1.80.1`:

        ```sh
        docker build . --file builder.dockerfile --tag rust-cosmwasm:1.80.1
        ```
    </TabGroupItem>
</TabGroup>

With the target installed, you can compile to WebAssembly with:

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        cargo build --release --target wasm32-unknown-unknown
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        ```sh
        docker run --rm -it \
            -v $(pwd):/root -w /root \
            rust-cosmwasm:1.80.1 \
            cargo build --release --target wasm32-unknown-unknown
        ```
    </TabGroupItem>
</TabGroup>

This `cargo build` command is a bit verbose so it pays to create an alias. The right place for that is in `.cargo/config.toml`. Create the folder and the file:

```sh
mkdir .cargo
touch .cargo/config.toml
```

And in it, put:

<CodeBlock title=".cargo/config.toml">
```toml
[alias]
wasm = "build --release --target wasm32-unknown-unknown"
```
</CodeBlock>

With this alias defined, you can now use `cargo wasm` instead of writing `cargo build --release --target wasm32-unknown-unknown`. Change your command to:

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        cargo wasm
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        ```sh
        docker run --rm -it \
            -v $(pwd):/root -w /root \
            rust-cosmwasm:1.80.1 \
            cargo wasm
        ```
    </TabGroupItem>
</TabGroup>

## Compilation to CosmWasm

While you are working on the configuration, you might as well add some elements necessary to compile to a type amenable to the CosmWasm module, along with flags curated by the CosmWasm team. Add the following lines in `Cargo.toml` below the `[package]` section:

<CodeBlock title="Cargo.toml">
    ```diff
    [package]
    name = "my-nameservice"
    version = "0.1.0"
    edition = "2021"

    + # Linkage options. More information: https://doc.rust-lang.org/reference/linkage.html
    + [lib]
    + crate-type = ["cdylib", "rlib"]

    + [features]
    + # Use library feature to disable all instantiate/execute/query exports
    + library = []

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

    [dependencies]
    ...
    ```
</CodeBlock>

You can now build your smart contract, then store and deploy on-chain the generated wasm found in `target/wasm32-unknown-unknown/release/my_nameservice.wasm`. Refer to the hello world for how to do it.

<HighlightBox type="info" title="Exercise progression">

At this stage, you should have something similar to the [`compilation-elements`](https://github.com/b9lab/cw-my-nameservice/tree/compilation-elements) branch, with [this](https://github.com/b9lab/cw-my-nameservice/compare/improve-error-reporting..compilation-elements) as the diff.

</HighlightBox>

## Unit testing

You have not written much of a smart contract. However it is still useful to prepare the unit testing elements that will come in handy when your smart contract becomes larger. Unit testing does not touch the WebAssembly target or the CosmWasm module. See the integration tests for that. The tests are run purely to test your functions in isolation within Rust.

In `src/contract.rs`, add this at the end of the file:

<CodeBlock title="src/contract.rs">
    ```rust
    #[cfg(test)]
    mod tests {
        use crate::msg::InstantiateMsg;
        use cosmwasm_std::{testing, Addr, Response};

        #[test]
        fn test_instantiate() {
            // Arrange
            let mut mocked_deps_mut = testing::mock_dependencies();
            let mocked_env = testing::mock_env();
            let mocked_addr = Addr::unchecked("addr");
            let mocked_msg_info = testing::message_info(&mocked_addr, &[]);

            let instantiate_msg = InstantiateMsg {};

            // Act
            let contract_result = super::instantiate(
                mocked_deps_mut.as_mut(),
                mocked_env,
                mocked_msg_info,
                instantiate_msg,
            );

            // Assert
            assert!(contract_result.is_ok(), "Failed to instantiate");
            assert_eq!(contract_result.unwrap(), Response::default())
        }
    }
    ```
</CodeBlock>

Note how:

* It follows unit testing conventions.
* `cosmwasm_std::testing` provides a set of mocking functions for each of `instantiate`'s argument. In its current form the function expects but does not use the arguments, therefore you don't need to configure the mocks further.
* It tests the return type, but also its content.

With the test ready, you can run it with the following command:

<TabGroup sync>
    <TabGroupItem title="Local" active>
        ```sh
        cargo test
        ```
    </TabGroupItem>
    <TabGroupItem title="Docker">
        ```sh
        docker run --rm -it \
            -v $(pwd):/root/ -w /root \
            rust:1.80.1 \
            cargo test
        ```
    </TabGroupItem>
</TabGroup>

Which should print its success in the output:

```txt
...
running 1 test
test contract::tests::test_instantiate ... ok
...
```

## Conclusion

<HighlightBox type="info" title="Exercise progression">

At this stage, you should have something similar to the [`first-unit-test`](https://github.com/b9lab/cw-my-nameservice/tree/first-unit-test) branch, with [this](https://github.com/b9lab/cw-my-nameservice/compare/compilation-elements..first-unit-test) as the diff.

</HighlightBox>
