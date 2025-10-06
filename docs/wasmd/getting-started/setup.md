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

Running a node on Windows OS is not supported yet. However, you can use WSL (Windows Subsystem for
Linux) to run a node on Windows. Alternatively, you can build a Wasmd client for Windows with:
`make build-windows-client`.

:::
