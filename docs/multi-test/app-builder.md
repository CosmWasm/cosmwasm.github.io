---
sidebar_position: 5
---

# `AppBuilder`

[`AppBuilder`][AppBuilder] is an implementation of the [Builder Pattern] that provides a
flexible and modular way to construct the [`App`](./app) blockchain simulator. It allows smart
contract developers to configure various components of the blockchain simulator (e.g., Bank,
Staking, Gov, IBC) individually through dedicated `with_*` methods. Each method modifies and returns
a new instance of the builder, enabling method chaining for a fluent interface. The
[`build`][build] method finalizes the construction process, ensuring that all components are
correctly initialized and integrated.

The following sections detail all builder functions, providing specific usage examples.

## `default`

The simplest way to create a chain using [`AppBuilder`][AppBuilder] is by calling the
`default` method. Since [`AppBuilder`][AppBuilder] follows the principles of the
builder pattern, you need to finalize the building process by calling the [`build`][build]
method with a chain initialization callback function. When no specific chain initialization is
required you can just use the provided [`no_init`](app#no_init) callback. In the following code
example, the chain is created with default settings as described in
[Features summary](features#features-summary).

```rust showLineNumbers {3} copy /default/ /build/
use cw_multi_test::{no_init, AppBuilder};

let app = AppBuilder::default().build(no_init);

let sender_addr = app.api().addr_make("sender");

assert!(sender_addr.as_str().starts_with("cosmwasm1"));
```

## `new`

The constructor `new` is an equivalent of the `default` method in
[`AppBuilder`][AppBuilder]. The example below creates a chain with default settings as
described in [Features summary](features#features-summary).

```rust showLineNumbers {3} copy /new/ /build/
use cw_multi_test::{no_init, AppBuilder};

let app = AppBuilder::new().build(no_init);

let sender_addr = app.api().addr_make("sender");

assert!(sender_addr.as_str().starts_with("cosmwasm1"));
```

## `new_custom`

(WIP)

## `with_api`

The default [`Api`][Api] trait implementation used in [`AppBuilder`][AppBuilder] is
[`cosmwasm_std::testing::MockApi`][MockApi] provided by CosmWasm library. Besides other
functionalities described in detail in the [API](./api) chapter, the [`MockApi`][MockApi]
provides a function [`addr_make`][addr_make] for generating user addresses in **Bech32**
format with the `cosmwasm` prefix. An example usage is shown below.

```rust showLineNumbers copy {7} /api()/ /addr_make/ /cosmwasm/
use cw_multi_test::{no_init, AppBuilder};

// Create the chain with default Api implementation.
let app = AppBuilder::default().build(no_init);

// Create the address using default Api.
let sender_addr = app.api().addr_make("sender");

// Default Api generates Bech32 addresses with prefix 'cosmwasm'.
assert_eq!(
    "cosmwasm1pgm8hyk0pvphmlvfjc8wsvk4daluz5tgrw6pu5mfpemk74uxnx9qlm3aqg",
    sender_addr.as_str()
);
```

If you need to test contracts on your own chain that uses a specific Bech32 prefixes, you can easily
customize the default [`MockApi`][MockApi] behavior using the
[`AppBuilder::with_api`][with_api] method. An example of using `osmo` prefix is shown in the
following code snippet.

```rust showLineNumbers copy {1,6} /with_api/ /osmo/
use cosmwasm_std::testing::MockApi;
use cw_multi_test::{no_init, AppBuilder};

// Create the chain with customized default Api implementation.
let app = AppBuilder::default()
    .with_api(MockApi::default().with_prefix("osmo"))
    .build(no_init);

// Create the address using customized Api.
let sender_addr = app.api().addr_make("sender");

// This customized Api generates Bech32 addresses with prefix 'osmo'.
assert_eq!(
    "osmo1pgm8hyk0pvphmlvfjc8wsvk4daluz5tgrw6pu5mfpemk74uxnx9qcrt3u2",
    sender_addr.as_str()
);
```

**`MultiTest`** provides two additional implementations of the [`Api`][Api] trait:
[`MockApiBech32`][MockApiBech32] and [`MockApiBech32m`][MockApiBech32m]. You can use
them in your tests by providing their instances to [`AppBuilder::with_api`][with_api] method.

An example of using [`MockApiBech32`][MockApiBech32] with custom prefix:

```rust showLineNumbers copy {1,6} /with_api/ /juno/
use cw_multi_test::MockApiBech32;
use cw_multi_test::{no_init, AppBuilder};

// Create the chain with Bech32 Api implementation.
let app = AppBuilder::default()
    .with_api(MockApiBech32::new("juno"))
    .build(no_init);

// Create the address using Bech32 Api.
let sender_addr = app.api().addr_make("sender");

// This Api generates Bech32 addresses with prefix 'juno'.
assert_eq!(
    "juno1pgm8hyk0pvphmlvfjc8wsvk4daluz5tgrw6pu5mfpemk74uxnx9qwm56ug",
    sender_addr.as_str()
);
```

An example of using [`MockApiBech32m`][MockApiBech32m] with custom prefix:

```rust showLineNumbers copy {1,6} /with_api/ /juno/
use cw_multi_test::MockApiBech32m;
use cw_multi_test::{no_init, AppBuilder};

// Create the chain with Bech32m Api implementation.
let app = AppBuilder::default()
    .with_api(MockApiBech32m::new("juno"))
    .build(no_init);

// Create the address using Bech32m Api.
let sender_addr = app.api().addr_make("sender");

// This Api generates Bech32m addresses with prefix 'juno'.
assert_eq!(
    "juno1pgm8hyk0pvphmlvfjc8wsvk4daluz5tgrw6pu5mfpemk74uxnx9qm8yke2",
    sender_addr.as_str()
);
```

:::tip

  More details about the available [`Api`][Api] implementations are in the [API](api) chapter.
  If needed, you can provide your own implementation of the [`Api`][Api] trait and
  use it in your tests by utilizing the `with_api` method of the `AppBuilder`.
  
:::

## `with_bank`

(WIP)

## `with_block`

While the default block configuration is sufficient for most test cases, you can initialize the
chain with a custom [`BlockInfo`][BlockInfo] using the [`with_block`][with_block]
method provided by [`AppBuilder`][AppBuilder].

The following example demonstrates this use case in detail.

```rust showLineNumbers copy {15} /with_block/
use cosmwasm_std::{BlockInfo, Timestamp};
use cw_multi_test::{no_init, AppBuilder};

// create the chain builder
let builder = AppBuilder::default();

// prepare the custom block
let block = BlockInfo {
    height: 1,
    time: Timestamp::from_seconds(1723627489),
    chain_id: "starship-testnet".to_string(),
};

// build the chain initialized with the custom block
let app = builder.with_block(block).build(no_init);

// get the current block properties
let block = app.block_info();

// now the block height is 21
assert_eq!(1, block.height);

// now the block timestamp is Wed Aug 14 2024 09:24:49 GMT+0000
assert_eq!(1723627489, block.time.seconds());

// now the chain identifier is "starship-testnet"
assert_eq!("starship-testnet", block.chain_id);
```

The [`AppBuilder`][AppBuilder] is initialized with default settings in line 5. A custom block
is created in lines 8-12 and passed to the [`with_block`][with_block] method in line 15.
Since this is the only customization in this example, the blockchain construction is finalized in
the same line by calling the [`build`][build] method.

The current block metadata is retrieved in line 18, followed by value checks:

- line 21: the block height is now `1`,
- line 24: the block time is set to the Unix timestamp `1723627489`, representing
  `Wednesday, August 14, 2024, 09:24:49 GMT`,
- line 27: the chain identifier is now `"starship-testnet"`.

The [`with_block`][with_block] method of [`AppBuilder`][AppBuilder] can be combined
with any other `with_*` methods to configure a custom starting block.

## `with_custom`

(WIP)

## `with_distribution`

(WIP)

## `with_gov`

The [`with_gov`][with_gov] function allows you to customize the governance module of your
test blockchain environment. This function enables you to override the default governance module
with a custom implementation that suits your specific testing needs. Currently, **`MultiTest`**
provides two minimal implementations of the governance module that do not attempt to replicate real
blockchain behavior: [`GovAcceptingModule`][GovAcceptingModule] and
[`GovFailingModule`][GovFailingModule].

To use a built-in governance module that accepts all messages, initialize the chain like shown below
(line 4):

```rust showLineNumbers copy {15} /with_gov/ /GovAcceptingModule/
use cw_multi_test::{no_init, AppBuilder, GovAcceptingModule};

let app = AppBuilder::default()
    .with_gov(GovAcceptingModule::new())
    .build(no_init);
```

When processing governance messages in your tests should always fail, initialize the chain like in
the following code snippet (line 4):

```rust showLineNumbers copy /with_gov/ /GovFailingModule/
use cw_multi_test::{no_init, AppBuilder, GovFailingModule};

let app = AppBuilder::default()
    .with_gov(GovFailingModule::new())
    .build(no_init);
```

:::tip

Note that [`GovFailingModule`][GovFailingModule] is the default one in `App`.
  
:::

You can find more usage examples of the built-in governance modules in the [Governance](./governance) chapter.

## `with_ibc`

(WIP)

## `with_staking`

(WIP)

## `with_stargate`

(WIP)

## `with_storage`

By default, **`MultiTest`** uses [`MockStorage`][MockStorage], which is provided by the
CosmWasm library. [`MockStorage`][MockStorage] is an in-memory storage that does not persist
data beyond the test execution. Any values stored in it during testing are lost once the test
completes.

To use the default storage, simply initialize a chain with the default settings, as shown in the
following code snippet. After initialization, [`App`][App] provides two methods to access the
storage: [`storage`][storage] and [`storage_mut`][storage_mut]. The former is used for
reading the storage, while the latter allows both reading and writing.

```rust showLineNumbers {4} /storage_mut()/ /storage()/
use cosmwasm_std::Storage;
use cw_multi_test::{no_init, AppBuilder};

let mut app = AppBuilder::default().build(no_init);

let key = b"key";
let value = b"value";

app.storage_mut().set(key, value);

assert_eq!(value, app.storage().get(key).unwrap().as_slice());
```

You can also explicitly provide a [`MockStorage`][MockStorage] instance to the
[`with_storage`][with_storage] method of [`AppBuilder`][AppBuilder]. The example below
achieves the same result as the previous one.

```rust showLineNumbers {1,6} /storage_mut()/ /storage()/
use cosmwasm_std::testing::MockStorage;
use cosmwasm_std::Storage;
use cw_multi_test::{no_init, AppBuilder};

let mut app = AppBuilder::default()
    .with_storage(MockStorage::new())
    .build(no_init);

let key = b"key";
let value = b"value";

app.storage_mut().set(key, value);

assert_eq!(value, app.storage().get(key).unwrap().as_slice());
```

Initializing a chain with a [`MockStorage`][MockStorage] instance using the
[`with_storage`][with_storage] method of [`AppBuilder`][AppBuilder] allows for
sophisticated storage initialization before the chain starts. A simplified example is shown below.
In lines 8-9 the storage is created and initialized, then passed to `with_storage` method in
line 11. The initialization code in line 9 can of course be more complex in your test case.

```rust showLineNumbers {8,9,11} /with_storage/
use cosmwasm_std::testing::MockStorage;
use cosmwasm_std::Storage;
use cw_multi_test::{no_init, AppBuilder};

let key = b"key";
let value = b"value";

let mut storage = MockStorage::new();
storage.set(key, value);

let app = AppBuilder::default().with_storage(storage).build(no_init);

assert_eq!(value, app.storage().get(key).unwrap().as_slice());
```

It is worth noting that the same initialization can be implemented directly in a callback function
passed to [`build`][build] method of [`AppBuilder`][AppBuilder] as shown in the
following example:

```rust showLineNumbers {11} /build/
use cosmwasm_std::testing::MockStorage;
use cosmwasm_std::Storage;
use cw_multi_test::AppBuilder;

let key = b"key";
let value = b"value";

let app = AppBuilder::default()
    .with_storage(MockStorage::new())
    .build(|router, api, storage| {
        storage.set(key, value);
    });

assert_eq!(value, app.storage().get(key).unwrap().as_slice());
```

:::tip

In the examples above, to keep the simple, we accessed the storage directly and focused on the chain
initialization part involving the `with_storage` method of `AppBuilder`.
Please note, that inside smart contract code, the storage used by the chain should be accessed through
libraries like [StoragePlus](../storage-plus).
  
:::

You can find additional information about storage in the [Storage](./storage) chapter.

## `with_wasm`

(WIP)

## `build`

Since [`AppBuilder`][AppBuilder] follows the principles of the builder pattern, you must
always finalize the chain-building process by calling the [`build`][build] method with an
initialization callback function. If no specific chain initialization is required, you can use the
provided [`no_init`](app#no_init) callback. Otherwise, you can initialize the chain using a custom
callback function. An example of how to initialize a user's balance is shown below.

```rust showLineNumbers copy /build/
use cosmwasm_std::coin;
use cw_multi_test::AppBuilder;

let my_address = "me".into_addr();
let my_funds = vec![coin(23, "ATOM"), coin(18, "FLOCK")];

let app = AppBuilder::default().build(|router, api, storage| {
    router
        .bank
        .init_balance(storage, &my_address, my_funds)
        .unwrap();
});

assert_eq!(
    "23ATOM",
    app.wrap()
        .query_balance(my_address, "ATOM")
        .unwrap()
        .to_string()
);
```

[Api]: https://docs.rs/cosmwasm-std/latest/cosmwasm_std/trait.Api.html
[App]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.App.html
[AppBuilder]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.AppBuilder.html
[build]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.AppBuilder.html#method.build
[Builder Pattern]: https://en.wikipedia.org/wiki/Builder_pattern
[BlockInfo]: https://docs.rs/cosmwasm-std/latest/cosmwasm_std/struct.BlockInfo.html
[GovAcceptingModule]: https://docs.rs/cw-multi-test/latest/cw_multi_test/type.GovAcceptingModule.html
[GovFailingModule]: https://docs.rs/cw-multi-test/latest/cw_multi_test/type.GovFailingModule.html
[MockApi]: https://docs.rs/cosmwasm-std/latest/cosmwasm_std/testing/struct.MockApi.html
[MockApiBech32]: https://docs.rs/cw-multi-test/latest/cw_multi_test/type.MockApiBech32.html
[MockApiBech32m]: https://docs.rs/cw-multi-test/latest/cw_multi_test/type.MockApiBech32m.html
[with_api]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.AppBuilder.html#method.with_api
[with_block]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.AppBuilder.html#method.with_block
[with_gov]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.AppBuilder.html#method.with_gov
[with_storage]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.AppBuilder.html#method.with_storage
[addr_make]: https://docs.rs/cosmwasm-std/latest/cosmwasm_std/testing/struct.MockApi.html#method.addr_make
[MockStorage]: https://docs.rs/cosmwasm-std/latest/cosmwasm_std/testing/struct.MockStorage.html
[storage]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.App.html#method.storage
[storage_mut]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.App.html#method.storage_mut
