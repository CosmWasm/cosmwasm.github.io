---
sidebar_position: 1
---

# Item

An `Item` is a container that contains a single value that is potentially stored in some storage
identified by a unique key.

:::tip
More information can be found in the [API docs].
:::


## Item lifecycle

Just creating an `Item` does not commit anything to storage yet. In order to actually store a value
into a storage, you need to call the `save` method.

At the moment, values are serialized to the underlying storage in the JSON format. Your value must
implement the `Serialize` and `Deserialize` traits from the [`serde`] crate in order to be stored.

:::tip
This is an implementation detail that may change in the future.
You should always use the provided API methods to interact with the storage.
:::

### Loading existing values

`cw-storage-plus` provides you with two functions for loading an `Item`:

- `load` - which will return an error if the `Item` is empty or if deserialization fails.
- `may_load` - which will return `Ok(None)` if the `Item` is empty, and an error if deserialization
  fails.

### Lifecycle example

```rust
use cw_storage_plus::Item;

// First create an item. It does not exist in storage yet.
let value: Item<String> = Item::new("v");
assert_eq!(value.may_load(&storage).unwrap(), None);

// Save a value to storage
let some_value = "Storage cycle".to_string();
value.save(&mut storage, &some_value).unwrap();

// Load the value from storage
assert_eq!(value.load(&storage).unwrap(), some_value);

// Update the value
let new_value = "Update cycle".to_string();
value.save(&mut storage, &new_value).unwrap();

// Load the updated value
assert_eq!(value.load(&storage).unwrap(), new_value);

// Remove the value from storage
value.remove(&mut storage);

// Check that the value is removed
assert!(!value.exists(&storage));
```

## Usage examples

### Saving an admin address

```rust
use cw_storage_plus::Item;

let admin: Item<String> = Item::new("a");
assert_eq!(admin.may_load(&storage).unwrap(), None);

admin.save(&mut storage, &"some_address".to_string()).unwrap();
assert_eq!(admin.load(&storage).unwrap(), "some_address");
```

### Maintaining a config structure

```rust
use cw_storage_plus::Item;
use serde::{Serialize, Deserialize};

#[cw_serde]
struct Config {
    admin: String,
    interest_rate: Decimal,
}

let cfg = Config {
    admin: "some_address".to_string(),
    interest_rate: Decimal::percent(5),
};
let cfg_storage: Item<Config> = Item::new("c");
cfg_storage.save(&mut storage, &cfg).unwrap();

assert_eq!(cfg_storage.load(&storage).unwrap(), cfg);
```

### Default values

Sometimes you might like to read a value, but if it may have never been set, you want to provide a default.
This is a common pattern for counters or other numeric values.

```rust
use cw_storage_plus::Item;

let counter: Item<u128> = Item::new("t");

let mut total = counter.may_load(&storage).unwrap().unwrap_or(0);

assert_eq!(total, 0);
total += 1;

counter.save(&mut storage, &total).unwrap();
```

[`serde`]: https://serde.rs/
[API docs]: https://docs.rs/cw-storage-plus/latest/cw_storage_plus/struct.Item.html
