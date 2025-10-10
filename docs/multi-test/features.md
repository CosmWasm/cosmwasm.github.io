---
sidebar_position: 2
---

# Features

## Features summary

All **MultiTest** features are listed in the table below.

The **Default&nbsp;implementation** column indicates whether the feature has a default
implementation in **MultiTest** that simulates the functionality of the real blockchain as closely
as possible. In cases where **MultiTest** does not have a default implementation for the feature,
you can provide your own, using `AppBuilder`'s function listed in **AppBuilder&nbsp;constructor**
column. Names of **MultiTest** feature flags required to enable specific functionality are shown
in the column **Feature&nbsp;flag**.

| Feature        | Default<br/>implementation                        | Feature<br/>flag | AppBuilder<br/>constructor                           | Functionality                                      |
|----------------|---------------------------------------------------|:----------------:|------------------------------------------------------|----------------------------------------------------|
| [Blocks]       | [`mock_env().block`][mock_env_block]       |                  | [`with_block`](app-builder#with_block)               | Operations on blocks.                              |
| [Api]          | [`MockApi`][MockApi]                       |                  | [`with_api`](app-builder#with_api)                   | Access to CosmWasm API.                            |
| [Storage]      | [`MockStorage`][MockStorage]               |                  | [`with_storage`](app-builder#with_storage)           | Access to storage.                                 |
| [Bank]         | [`BankKeeper`][BankKeeper]                 |                  | [`with_bank`](app-builder#with_bank)                 | Interactions with **Bank** module.                 |
| [Staking]      | [`StakeKeeper`][StakeKeeper]               |    `staking`     | [`with_staking`](app-builder#with_staking)           | Interactions with **Staking** module.              |
| [Distribution] | [`DistributionKeeper`][DistributionKeeper] |    `staking`     | [`with_distribution`](app-builder#with_distribution) | Interactions with **Distribution** module.         |
| [Governance]   | [`GovFailingModule`][GovFailingModule]     |                  | [`with_gov`](app-builder#with_gov)                   | Interactions with **Governance** module.           |
| [Stargate]     | [`StargateFailing`][StargateFailing]       |    `stargate`    | [`with_stargate`](app-builder#with_stargate)         | Operations using `Stargate` and/or `Any` messages. |
| [Wasm]         | [`WasmKeeper`][WasmKeeper]                 |                  | [`with_wasm`](app-builder#with_wasm)                 | Interactions with **Wasm** module.                 |
| [Custom]       | [`FailingModule`][FailingModule]           |                  | [`new_custom`](app-builder#new_custom)               | Operations using custom module.                    |
| [IBC]          | [`IbcFailingModule`][IbcFailingModule]     |    `stargate`    | [`with_ibc`](app-builder#with_ibc)                   | Inter-blockchain communication operations.         |

## Feature flags summary

The following table summarizes feature flags supported by **MultiTest**.

| Feature flag   | Description                                                                                                                         |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `backtrace`    | Enables `backtrace` feature in _**anyhow**_ dependency.                                                                             |
| `staking`      | Enables `staking` feature in _**cosmwasm-std**_ dependency and enables staking/distribution functionality in **MultiTest** library. |
| `stargate`     | Enables `stargate` feature in _**cosmwasm-std**_ dependency and enables stargate/IBC functionality in **MultiTest** library.        |
| `cosmwasm_1_1` | Enables `cosmwasm_1_1` feature in _**cosmwasm-std**_ dependency.                                                                    |
| `cosmwasm_1_2` | Enables `cosmwasm_1_2` feature in _**cosmwasm-std**_ dependency and additionally `cosmwasm_1_1` feature in **MultiTest** library.   |
| `cosmwasm_1_3` | Enables `cosmwasm_1_3` feature in _**cosmwasm-std**_ dependency and additionally `cosmwasm_1_2` feature in **MultiTest** library.   |
| `cosmwasm_1_4` | Enables `cosmwasm_1_4` feature in _**cosmwasm-std**_ dependency and additionally `cosmwasm_1_3` feature in **MultiTest** library.   |
| `cosmwasm_2_0` | Enables `cosmwasm_2_0` feature in _**cosmwasm-std**_ dependency and additionally `cosmwasm_1_4` feature in **MultiTest** library.   |
| `cosmwasm_2_1` | Enables `cosmwasm_2_1` feature in _**cosmwasm-std**_ dependency and additionally `cosmwasm_2_0` feature in **MultiTest** library.   |
| `cosmwasm_2_2` | Enables `cosmwasm_2_2` feature in _**cosmwasm-std**_ dependency and additionally `cosmwasm_2_1` feature in **MultiTest** library.   |
| `cosmwasm_3_0` | Enables `cosmwasm_3_0` feature in _**cosmwasm-std**_ dependency and additionally `cosmwasm_2_2` feature in **MultiTest** library.   |

## Starting point

Usually, a good starting point when using **MultiTest** is the following dependency configuration in the **Cargo.toml** file:

```toml title="Cargo.toml"
[dependencies]
cosmwasm-std = "3"

[dev-dependencies]
cw-multi-test = { version = "3", features = ["staking", "stargate", "cosmwasm_3_0"] }
```

[Blocks]: ./introduction.md
[Api]: ./introduction.md
[Storage]: ./introduction.md
[Bank]: ./introduction.md
[Staking]: ./introduction.md
[Distribution]: ./introduction.md
[Governance]: ./introduction.md
[Stargate]: ./introduction.md
[Wasm]: ./introduction.md
[Custom]: ./introduction.md
[IBC]: ./introduction.md
[mock_env_block]: https://docs.rs/cosmwasm-std/latest/cosmwasm_std/testing/fn.mock_env.html
[MockApi]: https://docs.rs/cosmwasm-std/latest/cosmwasm_std/testing/struct.MockApi.html
[MockStorage]: https://docs.rs/cosmwasm-std/latest/cosmwasm_std/testing/struct.MockStorage.html
[BankKeeper]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.BankKeeper.html
[StakeKeeper]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.StakeKeeper.html
[DistributionKeeper]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.DistributionKeeper.html
[GovFailingModule]: https://docs.rs/cw-multi-test/latest/cw_multi_test/type.GovFailingModule.html
[StargateFailing]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.StargateFailing.html
[WasmKeeper]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.WasmKeeper.html
[FailingModule]: https://docs.rs/cw-multi-test/latest/cw_multi_test/struct.FailingModule.html
[IbcFailingModule]: https://docs.rs/cw-multi-test/latest/cw_multi_test/type.IbcFailingModule.html
