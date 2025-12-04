---
title: Migrating
sidebar_position: 9
---

# Migrating contracts

This guide explains what is needed to upgrade contracts when migrating over major releases of `cosmwasm`.
Note that you can also view the [complete CHANGELOG] to understand the differences.

[complete CHANGELOG]: https://github.com/CosmWasm/cosmwasm/blob/main/CHANGELOG.md

## 2.x.y -> 3.0.x

### Update `cosmwasm-*` dependencies in Cargo.toml (skip the ones you don't use)

```toml
[dependencies]
cosmwasm-std = "3.0.2"
cosmwasm-schema = "3.0.2"
# ...

[dev-dependencies]
cosmwasm-vm = "3.0.2"
# ...
```

-> If you were using `cosmwasm-std`'s `abort` feature, you can remove it, as it is the default now.
The `cranelift` feature also needs to be removed. It didn't do anything anymore since 2.2.0,
and now it is removed completely.

-> If you are using `cosmwasm-std` with `default-features = false` in a contract (not a library),
you need to enable the `exports` feature now.

-> If you were still using the deprecated functions `from_slice`, `from_binary`, `to_vec` or `to_binary`,
you now need to replace them with the new equivalents:

```rust
//diff-del
-cosmwasm_std::from_slice(&data)
//diff-add
+cosmwasm_std::from_json(&data)

//diff-del
-cosmwasm_std::from_binary(&data)
//diff-add
+cosmwasm_std::from_json(&data)

//diff-del
-cosmwasm_std::to_vec(&data)
//diff-add
+cosmwasm_std::to_json_vec(&data)

//diff-del
-cosmwasm_std::to_binary(&data)
//diff-add
+cosmwasm_std::to_json_binary(&data)
```

-> `TransactionInfo` is now `non_exhaustive`, so if you were destructuring it before, you will need to access
the fields individually instead. Similarly, `GovMsg` is also `non_exhaustive` now, so if you were matching on it,
you will need to use a wildcard pattern or access the fields individually.

-> Replace all calls of `{Uint256, Uint512, Int256, Int512}::new` with `{Uint256, Uint512, Int256, Int512}::from_be_bytes`.
Alternatively, you can pass a `u128/i128` to `new`.

-> Replace calls to the deprecated `{Decimal, Decimal256, SignedDecimal, SignedDecimal256}::raw` with normal constructors:

```rust
//diff-del
-Decimal::raw(value)
//diff-add
+Decimal::new(Uint128::new(value))

//diff-del
-Decimal256::raw(value)
//diff-add
+Decimal256::new(Uint256::new(value))

//diff-del
-SignedDecimal::raw(value)
//diff-add
+SignedDecimal::new(Int128::new(value))

//diff-del
-SignedDecimal256::raw(value)
//diff-add
+SignedDecimal256::new(Int256::new(value))
```

-> Replace all uses of `Uint256::from_u128` and `Int256::from_i128`:

```rust
//diff-del
-Uint256::from_u128(value)
//diff-add
+Uint256::new(value)

//diff-del
-Int256::from_i128(value)
//diff-add
+Int256::new(value)
```

-> If you were using `cosmwasm_std::MemoryStorage`, you need to replace it with `cosmwasm_std::testing::MockStorage`.

-> The previously deprecated `mock_info` has been removed. Use `message_info` instead:

```rust
//diff-del
-let info = mock_info("creator", &coins(1000, "earth"));
//diff-add
+let info = message_info(&mock_api.addr_make("creator), &coins(1000, "earth"));
```

-> `Coin::amount` has been changed to `Uint256` instead of `Uint128`, so you probably have to change
a lot of the math you do with it. For example:

```rust
//diff-del
-let amount = coin.amount * Uint128::new(2);
//diff-add
+let amount = coin.amount * Uint256::new(2);
```

-> `BankQuery::AllBalances` and `IbcQuery::ListChannels` have been removed without replacement.
If you were using them, you will need to redesign your protocol to not rely on them.
If you were using `BankQuery::AllBalances`, you can use `BankQuery::Balance` instead.
If you were using `IbcQuery::ListChannels`, you can save the channel information
for each channel yourself in contract storage.

-> `ExternalApi`, `ExternalQuerier` and `ExternalStorage` exports have been removed,
as they are not intended to be used outside of cosmwasm-std.

-> We did some big changes to `StdError`. Most of the constructors have been removed.
Instead, you can just convert any type implementing the `Error` trait into `StdError` using the `?` operator.
Optionally, you can add an error kind using the new `.kind(...)` method.

```rust
//diff-del
-Err(StdError::generic_err("Invalid input"))
//diff-add
+Err(StdError::msg("Invalid input"))

//diff-del
-let hrp = Hrp::parse(self.prefix).map_err(|e| StdError::generic_err(e.to_string()))?;
//diff-add
+let hrp = Hrp::parse(self.prefix)?;
```

-> If you were using something like anyhow, you probably want to replace `anyhow::Result`
with `cosmwasm_std::StdResult`, since the new `StdError` does not implement the `Error` trait anymore,
so you cannot convert it into `anyhow::Error` anymore.

```rust
//diff-del
-) -> anyhow::Result<AppResponse> {
//diff-add
+) -> StdResult<AppResponse> {
```
