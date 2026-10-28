---
sidebar_position: 1
---

# Set up local environment

## Install Go

To build and install Wasmd, Go is required. If you haven't installed Go yet, you can set it up by
visiting the [Go download and install page](https://go.dev/doc/install).

:::tip

The latest version of wasmd requires `go version v1.21`.

:::


## Set up Wasmd

Clone the wasmd repository

```shell
git clone https://github.com/CosmWasm/wasmd.git && cd wasmd
```

Select the most stable version

```shell
git checkout v0.52.0 # replace the v0.52.0 with the most stable version
```

Install wasmd

```shell
make install
```

You can verify the version of Wasmd you have once it is installed:

```shell
wasmd version
```

:::warning

Running a node on Windows OS is **NOT SUPPORTED**.

:::

:::danger

We support `x86_64` and `aarch64` CPU architectures only for development purposes.

In production, chains MUST use **wasmd** only with **`x86_64`** **libwasmvm** libraries.
All validators in a production chain MUST have the same, **`x86_64`** CPU architecture when using **wasmd**.

:::
