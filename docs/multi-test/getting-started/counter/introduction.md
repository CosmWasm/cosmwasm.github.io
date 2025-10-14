# Counter

The following sections describe how to create an example smart contract,
which manages a **counter** that can be `initialized`, `incremented`, `decremented`, and `queried`.
Later on, you will be [writing tests](../writing-tests/introduction.md) for this smart contract using **MultiTest**.

:::info

**Counter** smart contract is a simplified version of the contract created from the
[cw-template](https://github.com/CosmWasm/cw-template).
Check [Setting up the contract](../../../core/installation#setting-up-the-contract) for more details.

:::

## Specification

The example smart contract is a simple **counter** that allows users to initialize the counter,
perform operations such as incrementing, decrementing, setting a specific value, and querying the
current counter value. The primary purpose of this contract is to maintain and manipulate a counter
value on the blockchain. This functionality can be utilized in various scenarios where a count or
tally needs to be tracked, such as counting votes, tracking the number of actions performed,
or maintaining a score in a game or competition.

**Features:**

- The counter can be initialized with a value of zero or any non-negative integer between 0 and 255.
- Users can increment, decrement, or set the counter to a new value within the range of 0 to 255.
- Boundary conditions are checked, preventing the counter from going below 0 or beyond 255.
- Users can query the current value of the counter at any time.
- The counter's value is persisted and limited to 8-bit unsigned integers [0..255].

## Creating the counter project

Smart contracts written in Rust are developed as Rust libraries, so let's first create a Rust
library named **counter**.

Change the working directory to your home directory:

```shell title="terminal"
cd ~
```

Create a dedicated directory to store your example smart contract:

```shell title="terminal"
mkdir my-contracts
```

Change the working directory to `my-contracts`:

```shell title="terminal"
cd my-contracts
```

Create a new Rust library named **counter**:

```shell title="terminal"
cargo init --lib counter
```

Change the working directory to `counter`:

```shell title="terminal"
cd counter
```

Newly created library contains the **Cargo.toml** file and **lib.rs** file in `src` directory,
so the expected structure of the `counter` directory is:

```text title="counter directory"
.
├── Cargo.toml
└── src
    └── lib.rs
```

By convention, the source code of the smart contract is placed in a file named **contract.rs**, and
the messages processed by this contract are usually placed in file named **msg.rs**. Both files
should be stored in `src` directory.

Let's create an empty **contract.rs** file...

```shell title="terminal"
touch src/contract.rs
```

...and empty **msg.rs** file:

```shell title="terminal"
touch src/msg.rs
```

The final structure of the smart contract project placed in the `counter` directory should look like this:

```text title="counter directory"
.
├── Cargo.toml
└── src
    ├── contract.rs
    ├── lib.rs
    └── msg.rs
```

## Filling the content

In this section you have created a project structure for **counter** smart contract,
but the source files are still empty. In the following chapter, we provide an example
[**implementation**](./implementation.md) of the **counter** smart contract.
