---
sidebar_position: 1
---

# Installation

**MultiTest** is as a [Rust] library named [cw-multi-test] and is hosted on [crates.io].

## Usage

To use **MultiTest** in your project, simply add it as a **development dependency** to **Cargo.toml** file:

```toml title="Cargo.toml"
[dev-dependencies]
cw-multi-test = "3"
```

:::warning

**MultiTest** is a **TESTING** library and should **ALWAYS** be added to your project
as a **DEVELOPMENT DEPENDENCY** in section **`[dev-dependencies]`** of the **Cargo.toml** file.

:::
  
:::warning

**MultiTest** <span style={{color:'red'}}>**IS NOT**</span> designed to be used in production code on a real-life blockchain.

:::

## Prerequisites

### Rust and Cargo

The only prerequisite to test smart contracts using **MultiTest** is having [Rust and Cargo] installed.

:::info

We recommend installing Rust using the official [rustup installer]. This makes it easy
to stay on the most recent version of Rust and Cargo.
  
:::

### Tarpaulin and cargo-nextest

Optionally, you may want to install [Tarpaulin] for measuring code coverage, and [cargo-nextest] for
running tests faster with a clean and beautiful user interface.

Installing **Tarpaulin**:

```shell title="terminal"
cargo install cargo-tarpaulin
```

Installing **cargo-nextest**:

```shell title="terminal"
cargo install cargo-nextest
```

[rustup installer]: https://rustup.rs
[Rust and Cargo]: https://www.rust-lang.org/tools/install
[Rust]: https://www.rust-lang.org
[Tarpaulin]: https://github.com/xd009642/tarpaulin
[cargo-nextest]: https://nexte.st
[cw-multi-test]: https://crates.io/crates/cw-multi-test
[crates.io]: https://crates.io
