---
title: Hello World!
description: All on your machine
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Hello World!

As always, the goal of every _Hello World!_ exercise is to give you a feel of the technology,
but also to superficially experience how the concepts you learned map to something more tangible.
Don't hesitate to expand the collapsed sections if you want to dive deep on certain points,
with a view to better understand the mechanics of it.

These first steps take inspiration from the CosmWasm [docs' hello world](https://docs.cosmwasm.com/docs/getting-started/intro),
and from the Cosmos SDK's [basic tutorial](https://tutorials.cosmos.network/tutorials/3-run-node/).
The difference is that after you have downloaded all the packages and dependencies,
you no longer need access to other online resources.

It offers two tracks, you can either do all your compilations and running natively on your computer,
or achieve the same in Docker. If you choose the Docker path, that allows you to hold off installing anything other than Docker.

## What will happen

Here are the steps you are going to complete:

- Build the blockchain code.
- Create a running Cosmos blockchain:
  - With a single running node.
  - With CosmWasm installed
- Compile a smart contract code.
- Store the code and deploy a smart contract instance.
- Interact with it.

Let's get started.

[Install pre-requisites](https://docs.cosmwasm.com/core/installation). Either on your computer, or install Docker.
Including [JQ](https://jqlang.github.io/jq/).

## Build your blockchain code

Clone **wasmd**, which is the _simd_ of CosmWasm, at [v0.53.2](https://github.com/CosmWasm/wasmd/tree/v0.53.2).

```shell
git clone https://github.com/CosmWasm/wasmd --branch v0.53.2
cd wasmd
```

Build the blockchain application.

<Tabs groupId="local-docker">
  <TabItem value="Local" default>
    ```shell
    make build
    ```
  </TabItem>
  <TabItem value="Docker">
    ```shell
    docker build --tag wasmd:0.53.2 .
    ```
  </TabItem>
</Tabs>

With this done, `.build/wasmd` or Docker's `wasmd:0.53.2` is your blockchain executable.


## Prepare your blockchain

After you have compiled your blockchain code, and before you can turn your focus to CosmWasm, you need a running blockchain.
This step has you prepare the blockchain application, test keys and a genesis file.

:::warning Are you a validator?

If you have previously used wasmd, you may already have data in your `~/.wasmd` folder.
It is typically safe to erase the `config` sub-folder. But **if you are a validator** on one of the wasmd networks,
this exercise is not safe, so stop right there or proceed at your own risks.

The Docker track also uses your local folder, by sharing it as a volume with the flag `-v $HOME/.wasmd:/root/.wasmd`,
so that you can switch to the local track at a later stage. Make space in the `~/.wasmd` folder:

```shell
rm -rf ~/.wasmd/config \
    ~/.wasmd/data \
    ~/.wasmd/wasm
```

:::

Initialize the blockchain application's genesis file and other configuration files.

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd init validator-1 \
            --chain-id learning-chain-1
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $HOME/.wasmd:/root/.wasmd \
            wasmd:0.53.2 \
            wasmd init validator-1 \
                --chain-id learning-chain-1
        ```
    </TabItem>
</Tabs>

If you are curious, you can see what was created in `~/.wasmd`.

Then you can add a convenient but low-safety key for Alice, who shall become the validator operator.

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd keys add alice \
            --keyring-backend test
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $HOME/.wasmd:/root/.wasmd \
            wasmd:0.53.2 \
            wasmd keys add alice \
                --keyring-backend test
        ```
    </TabItem>
</Tabs>

Make a note of the seed phrase so that you can reuse it in a Node.js REPL console.

To become a validator, Alice needs an initial balance in the staking token. Give her one:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd genesis \
            add-genesis-account alice 100000000stake \
            --keyring-backend test
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $HOME/.wasmd:/root/.wasmd \
            wasmd:0.53.2 \
            wasmd genesis \
                add-genesis-account alice 100000000stake \
                --keyring-backend test
        ```
    </TabItem>
</Tabs>

Have Alice create and sign the token-staking transaction that will make Alice an initial validator.

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd genesis \
            gentx alice 70000000stake \
            --keyring-backend test \
            --chain-id learning-chain-1
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $HOME/.wasmd:/root/.wasmd \
            wasmd:0.53.2 \
            wasmd genesis \
                gentx alice 70000000stake \
                --keyring-backend test \
                --chain-id learning-chain-1
        ```
    </TabItem>
</Tabs>

The system tells you that a file has been created with a signed transaction in it.
Add this signed transaction to the genesis file so that Alice starts indeed as a validator.

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd genesis collect-gentxs
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $HOME/.wasmd:/root/.wasmd \
            wasmd:0.53.2 \
            wasmd genesis collect-gentxs
        ```
    </TabItem>
</Tabs>

:::info

The blockchain preparation is now done, and you need not redo the above steps if you restart this exercise at a later date.

:::

## Run your blockchain

:::info

If you stopped `wasmd` earlier, you can come back here and restart `wasmd` where you left it off.

:::

Run Alice's validating node to start the blockchain system and to interact with it.

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd start
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            --name val-alice-1 \
            -v $HOME/.wasmd:/root/.wasmd \
            wasmd:0.53.2 \
            wasmd start
        ```
    </TabItem>
</Tabs>

Your node is now running and ready to receive smart contracts.

<details>
  <summary>Confirm you are set up correctly</summary>

If you are new to Cosmos, you may want to confirm that you are correctly set up. Other than looking at the block height
increasing in the log, a simple verification is to check Alice's balance if it is as expected in another terminal.
First, store her address:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        alice=$(./build/wasmd keys show alice \
            --keyring-backend test \
            --address)
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        alice=$(docker run --rm -i \
            -v $HOME/.wasmd:/root/.wasmd \
            wasmd:0.53.2 \
            wasmd keys show alice \
                --keyring-backend test \
                --address | tr -d '\r')
        ```
    </TabItem>
</Tabs>

Confirm you have the correct address with:

```shell
echo -n $alice
```

Which returns something like **wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as**.
With that, you can query for her balance:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query bank balances $alice
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query bank balances $alice
        ```
    </TabItem>
</Tabs>

The expected answer:

```yaml
balances:
- amount: "30000000"
  denom: stake
pagination:
  total: "1"
```

Indeed, she started with **100,000,000** and staked **70,000,000**, so she now has only **30,000,000**
remaining available. The staking rewards that she has accumulated are not available until they are collected.

</details>

## Compile your smart contract

With a running chain, you can start interacting with the CosmWasm module.
First you are going to download and compile a smart contract.

We will use the same `nameservice` smart contract of the [long running exercise](./05-first-contract.md)
but at the intermediate [`add-first-library`](https://github.com/b9lab/cw-my-nameservice/tree/add-first-library) branch.
In another terminal, start by cloning it and changing the directory.

```shell
git clone https://github.com/b9lab/cw-my-nameservice --branch add-first-library
cd cw-my-nameservice/contracts/nameservice
```

At this version of the contract, it compiles with Rust v1.80.1 to the WASM target.

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        rustup install 1.80.1
        rustup target add wasm32-unknown-unknown --toolchain 1.80.1
        RUSTFLAGS='-C link-arg=-s' cargo +1.80.1 wasm
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker run --rm -it \
            -v $(pwd):/root \
            -w /root \
            rust:1.80.1 \
            sh -c "rustup target add wasm32-unknown-unknown && \
            RUSTFLAGS='-C link-arg=-s' cargo +1.80.1 wasm"
        ```
    </TabItem>
</Tabs>

The compiled WebAssembly is located relative to the contract dir in `./target/wasm32-unknown-unknown/release/cw_my_nameservice.wasm`.
The file ends up at about 221 KB in size. In fact, the `RUSTFLAGS='-C link-arg=-s'` flag is there to reduce its size,
always a concern in blockchain. You can remove the flag as a test, and you should see that it then ends up at 1.5 MB in size.

Copy the file to the `~/.wasmd` so as to reuse it when storing the code on-chain. Make the folder if it is missing:

```shell
mkdir -p $HOME/.wasmd/wasm/code
cp $(pwd)/target/wasm32-unknown-unknown/release/cw_my_nameservice.wasm \
    $HOME/.wasmd/wasm/code/cw_my_nameservice.wasm
```

Note that the `~/.wasmd` path is also accessible by the Docker container running the blockchain app,
which makes it convenient for this exercise.

## Store your contract code

With the bytecode of the smart contract ready, you are about to interact with the running chain again.
Return to the `wasmd` directory, in a new shell.

Start with a simple initial CosmWasm query to see what code, if any, has already been stored.

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm list-code
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 wasmd query wasm list-code
        ```
    </TabItem>
</Tabs>

As expected, it returns:

```yaml
code_infos: []
pagination: ...
```

It is time to store your first CosmWasm code with the `tx wasm store` command. Alice, who owns `stake` tokens, can do it.

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd tx wasm store $HOME/.wasmd/wasm/code/cw_my_nameservice.wasm \
            --from alice --keyring-backend test \
            --gas-prices 0.25stake --gas auto --gas-adjustment 1.3 \
            --chain-id learning-chain-1 \
            --yes --output json --broadcast-mode sync
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd tx wasm store /root/.wasmd/wasm/code/cw_my_nameservice.wasm \
            --from alice --keyring-backend test \
            --gas-prices 0.25stake --gas auto --gas-adjustment 1.3 \
            --chain-id learning-chain-1 \
            --yes --output json --broadcast-mode sync
        ```
    </TabItem>
</Tabs>

<details>
    <summary>If you are new to the Cosmos SDK</summary>

The structure of these commands is that:

1. `wasmd` is the name of the executable. It is already running with the `start` command.
    However, here you are executing it separately with different commands.
2. `query` or `tx` directs the execution to create a query object or a transaction object instead of running a blockchain.
3. `wasm` directs the execution to create query/tx objects for the `wasm` module.
4. The other parameters are those that are required to create the query/tx object.

After it has created and signed the object, `wasmd` sends it to the running blockchain through the standard local port,
unless you specify another host and port.

</details>

With `--broadcast-mode sync`, the command sends a transaction, but does not wait for it to be confirmed.
Instead, you get succinct information, including the transaction hash:

```json
{"height":"0","txhash":"34087EB0B74233E7E3C3AA9CE6EFCB4279130AF1C2BCAE992DD1E1D1775D02ED","codespace":"","code":0,"data":"","raw_log":"","logs":[],"info":"","gas_wanted":"0","gas_used":"0","tx":null,"timestamp":"","events":[]}
```

Make a note of this `txhash`, such as:

```shell
ns_store_txhash=34087EB0B74233E7E3C3AA9CE6EFCB4279130AF1C2BCAE992DD1E1D1775D02ED
```

With your specific value.

## Verify your stored code

The newly stored code has a newly created `id` that you need to know in order to use it.
The authoritative way is to retrieve the code information from the transaction's events itself.
The event of interest has the `type: "store_code"`:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query tx $ns_store_txhash --output json \
            | jq '.events[] | select(.type == "store_code")'
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query tx $ns_store_txhash --output json \
            | jq '.events[] | select(.type == "store_code")'
        ```
    </TabItem>
</Tabs>

Which returns something like:

```json
{
  "type": "store_code",
  "attributes": [
    {
      "key": "code_checksum",
      "value": "98f9924c5fbe94dd6ad24d71f2352593e54aac6aabcfaa9b1bf000f64b33992d",
      "index": true
    },
    {
      "key": "code_id",
      "value": "1",
      "index": true
    },
    {
      "key": "msg_index",
      "value": "0",
      "index": true
    }
  ]
}
```

There is a code id, predictably at `1`, and a code checksum.

:::tip

The `msg_index` is here to assist you with identifying which code is which,
in the rare case where you store two or more codes in a single transaction.

:::

Make a note of the code id as you will use it during instantiation:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ns_code_id=$(./build/wasmd query tx $ns_store_txhash --output json \
            | jq -r '.events[] | select(.type == "store_code") .attributes[] | select(.key == "code_id") .value')
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        ns_code_id=$(docker exec val-alice-1 \
            wasmd query tx $ns_store_txhash --output json \
            | jq -r '.events[] | select(.type == "store_code") .attributes[] | select(.key == "code_id") .value')
        ```
    </TabItem>
</Tabs>

Does the code checksum match? Let's check:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        sha256sum $HOME/.wasmd/wasm/code/cw_my_nameservice.wasm
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            sha256sum /root/.wasmd/wasm/code/cw_my_nameservice.wasm
        ```
    </TabItem>
</Tabs>

You should see the same value as the one emitted in the event.

<details>
    <summary>If you don't trust the checksum...</summary>

You can run a diff of the stored code and the one you have:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm code $ns_code_id \
            $HOME/.wasmd/wasm/code/downloaded_cw_my_nameservice.wasm
        diff $HOME/.wasmd/wasm/code/cw_my_nameservice.wasm \
            $HOME/.wasmd/wasm/code/downloaded_cw_my_nameservice.wasm
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm code $ns_code_id \
                /root/.wasmd/wasm/code/downloaded_cw_my_nameservice.wasm
        docker exec val-alice-1 \
            diff /root/.wasmd/wasm/code/cw_my_nameservice.wasm \
                /root/.wasmd/wasm/code/downloaded_cw_my_nameservice.wasm
        ```
    </TabItem>
</Tabs>

No message on the `diff` means that they are identical.

</details>

<details>
    <summary>What are the available commands?</summary>

At any time, you can use the Cosmos SDK convention to get information:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm --help
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm --help
        ```
    </TabItem>
</Tabs>

You should get this:

```text
Querying commands for the wasm module

Usage:
  wasmd query wasm [flags]
  wasmd query wasm [command]

Available Commands:
  build-address             build contract address
  code                      Downloads wasm bytecode for given code id
  code-info                 Prints out metadata of a code id
  contract                  Prints out metadata of a contract given its address
  contract-history          Prints out the code history for a contract given its address
  contract-state            Querying commands for the wasm module
  libwasmvm-version         Get libwasmvm version
  list-code                 List all wasm bytecode on the chain
  list-contract-by-code     List wasm all bytecode on the chain for given code id
  list-contracts-by-creator List all contracts by creator
  params                    Query the current wasm parameters
  pinned                    List all pinned code ids

Flags:
  -h, --help   help for wasm

Global Flags:
      --home string         directory for config and data (default "/root/.wasmd")
      --log_format string   The logging format (json|plain) (default "plain")
      --log_level string    The logging level (trace|debug|info|warn|error|fatal|panic|disabled or '*:≺level≻,≺key≻:≺level≻') (default "info")
      --log_no_color        Disable colored logs
      --trace               print out full stack trace on errors

Use "wasmd query wasm [command] --help" for more information about a command.
```
</details>

<details>
    <summary>Retrieve your code info again</summary>

You already have, but if you need it later on, you can simply call:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm code-info $ns_code_id
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm code-info $ns_code_id
        ```
    </TabItem>
</Tabs>

Which returns something like:

```yaml
code_id: "1"
creator: wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as
data_hash: 98F9924C5FBE94DD6AD24D71F2352593E54AAC6AABCFAA9B1BF000F64B33992D
instantiate_permission:
  addresses: []
  permission: Everybody
```

Make a mental note of the `instantiate_permission` as this is an advanced feature you can enable. If you are curious, you can have a look at it starting with:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd tx wasm store --help | grep -e --instantiate
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd tx wasm store --help | grep -e --instantiate
        ```
    </TabItem>
</Tabs>

Which yields:

```text
--instantiate-anyof-addresses strings   Any of the addresses can instantiate a contract from the code, optional
--instantiate-everybody string          Everybody can instantiate a contract from the code, optional
--instantiate-nobody string             Nobody except the governance process can instantiate a contract from the code, optional
--instantiate-only-address string       Removed: use instantiate-anyof-addresses instead
```

</details>

<details>
    <summary title="">Retrieve all code infos</summary>

Earlier, when you tried retrieving all code infos, it returned `[]`. Try again:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm list-code
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm list-code
        ```
    </TabItem>
</Tabs>

Now, you get something like:

```yaml
code_infos:
- code_id: "1"
  creator: wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as
  data_hash: 98F9924C5FBE94DD6AD24D71F2352593E54AAC6AABCFAA9B1BF000F64B33992D
  instantiate_permission:
    addresses: []
    permission: Everybody
pagination: ...
```

For the avoidance of doubt, trying to get the code id of your just-deployed bytecode is wrong.
In a real setting, you are not alone on the blockchain and you can easily get confused as to which code is yours.

</details>

## Deploy your contract instance

Now you have your bytecode stored on-chain, but no smart contract has been deployed using this code.
You can confirm this with:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm list-contract-by-code $ns_code_id
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm list-contract-by-code $ns_code_id
        ```
    </TabItem>
</Tabs>

This returns:

```yaml
contracts: []
pagination: ...
```

Time to instantiate your first CosmWasm smart contract.
The [constructor requires](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/contract.rs#L18)
a [specific message](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/msg.rs#L5-L7):

```rust title="msg.rs/InstantiateMsg"
pub struct InstantiateMsg {
    pub minter: String,
}
```

Which has to be serialized as JSON. The `minter` is the account that will be allowed to register new names.
To make it easy, you pick Alice as the minter.
Get her address:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        alice=$(./build/wasmd keys show alice \
            --keyring-backend test \
            --address)
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        alice=$(docker run --rm -i \
            -v $HOME/.wasmd:/root/.wasmd \
            wasmd:0.53.2 \
            wasmd keys show alice \
                --keyring-backend test \
                --address | tr -d '\r')
        ```
    </TabItem>
</Tabs>

The next action is to prepare the instantiate message by setting the right value:

```shell
ns_init_msg_1='{"minter":"'$alice'"}'
```

<details>
    <summary>Confirm that the message looks right</summary>

With:

```shell
echo $ns_init_msg_1
```

Which should return something like:

```text
{"minter":"wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as"}
```

</details>

With the message ready, you can send the command to instantiate your first smart contract:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd tx wasm instantiate $ns_code_id "$ns_init_msg_1" \
            --label "name service" --no-admin \
            --from alice --keyring-backend test \
            --chain-id learning-chain-1 \
            --gas-prices 0.25stake --gas auto --gas-adjustment 1.3 \
            --yes
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd tx wasm instantiate $ns_code_id "$ns_init_msg_1" \
                --label "name service" --no-admin \
                --from alice --keyring-backend test \
                --chain-id learning-chain-1 \
                --gas-prices 0.25stake --gas auto --gas-adjustment 1.3 \
                --yes
        ```
    </TabItem>
</Tabs>

Note that the meat of the command is `instantiate $ns_code_id "$ns_init_msg_1"`,
which would read as `instantiate 1 "{"minter":"wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as"}"`.

Once again, you get a transaction hash. Make a note of it with your own hash, for instance:

```shell
ns_instantiate_txhash_1=9881879B2A7663638D6DA81D6F9ECC7DBF8AA12B105817B06A761749A22764E1
```

<details>
    <summary>The full content of the transaction</summary>

Now that the transaction has likely been confirmed, you can retrieve it:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query tx $ns_instantiate_txhash_1 \
            --output json | jq
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query tx $ns_instantiate_txhash_1 \
                --output json | jq
        ```
    </TabItem>
</Tabs>

This returns a lot of elements, but don't miss the event of type `"instantiate"`.

</details>

## Retrieve your contract address

At this stage, what is important is the **address** at which your contract instance resides.
This is the address you will use to interact with your instantiated contract.
The authoritative way to get this information is to get it from the events,
more precisely at the event of type `"instantiate"`:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query tx $ns_instantiate_txhash_1 \
            --output json | jq '.events[] | select(.type == "store_code") .attributes[] | select(.key == "code_id") .value'
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query tx $ns_instantiate_txhash_1 \
                --output json | jq '.events[] | select(.type == "instantiate")'
        ```
    </TabItem>
</Tabs>

This returns something like:

```json
{
  "type": "instantiate",
  "attributes": [
    {
      "key": "_contract_address",
      "value": "wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d",
      "index": true
    },
    {
      "key": "code_id",
      "value": "1",
      "index": true
    },
    {
      "key": "msg_index",
      "value": "0",
      "index": true
    }
  ]
}
```

Here too, `msg_index` assists you when you have more than one instantiation in one transaction.
Your smart contract address is `wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d`,
which you can retrieve with:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ns_addr1=$(./build/wasmd query tx $ns_instantiate_txhash_1 \
            --output json | jq -r '.events[] | select(.type == "instantiate") .attributes[] | select(.key == "_contract_address") .value')
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        ns_addr1=$(docker exec val-alice-1 \
            wasmd query tx $ns_instantiate_txhash_1 \
                --output json | jq -r '.events[] | select(.type == "instantiate") .attributes[] | select(.key == "_contract_address") .value')
        ```
    </TabItem>
</Tabs>

Note how the address is much longer than a _regular_ address, like Alice's.
With the contract instantiated, you can query a few things about it.

<details>
    <summary>Get the same address via the list with code id</summary>

It is possible to get the same information by code id.

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm list-contract-by-code $ns_code_id
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm list-contract-by-code $ns_code_id
        ```
    </TabItem>
</Tabs>

This returns something like:

```yaml
contracts:
- wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d
pagination: ...
```

Of course, if you have more than one smart contracts here, you could easily get confused;
so the correct method is to use the transaction's event proper.

</details>

<details>
    <summary>What is this instance's metadata?</summary>

CosmWasm has kept some information about your new instance. At any time, you can retrieve it with:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm contract $ns_addr1
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm contract $ns_addr1
        ```
    </TabItem>
</Tabs>

Which returns something similar to:

```yaml
address: wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d
contract_info:
  admin: ""
  code_id: "1"
  created:
    block_height: "6596"
    tx_index: "0"
  creator: wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as
  extension: null
  ibc_port_id: ""
  label: name service
```

</details>

<details>
    <summary>What is this instance's balance?</summary>

At a later stage, your contract instances may hold a token balance. At any time, you can fetch this information with:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query bank balances $ns_addr1
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query bank balances $ns_addr1
        ```
    </TabItem>
</Tabs>

Which initially returns:

```yaml
balances: []
pagination: {}
```

Note how the `query bank balances` is purely a bank-module command, it does not involve the CosmWasm module. That's because the smart contract instance has an address that the bank module recognizes as valid, and that's all the bank module asks to start counting tokens.

</details>

<details>
    <summary>What is in the instance's storage?</summary>

The instance keeps its state in storage. If you come from Ethereum, you are familiar with the `web3.getStorageAt()` command, which returns a specific storage slot of a specific smart contract.

The equivalent command in CosmWasm is `query wasm contract-state`. Conveniently, it also has the `all` subcommand. So let's see what the instance has in storage with:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm contract-state all $ns_addr1
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm contract-state all $ns_addr1
        ```
    </TabItem>
</Tabs>

Which returns:

```yaml
models:
- key: 6E616D655F6D696E746572
  value: eyJvd25lciI6Indhc20xa2htdjZxbDRwa2h4azVyOThtNXp6NHRldHQ1NWRzbjYzdm1tNzYiLCJwZW5kaW5nX293bmVyIjpudWxsLCJwZW5kaW5nX2V4cGlyeSI6bnVsbH0=
pagination:
  next_key: null
  total: "0"
```

The `key` looks like ASCII. Convert it:

```shell
echo 6E616D655F6D696E746572 | xxd -r -p
```

This returns `name_minter`. The value looks like Base64. Convert it:

```shell
echo eyJvd25lciI6Indhc20xa2htdjZxbDRwa2h4azVyOThtNXp6NHRldHQ1NWRzbjYzdm1tNzYiLCJwZW5kaW5nX293bmVyIjpudWxsLCJwZW5kaW5nX2V4cGlyeSI6bnVsbH0= | base64 -D
```

This returns

```json
{"owner":"wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as","pending_owner":null,"pending_expiry":null}
```

This is reassuringly consistent with:

1. The declaration of the `MINTER` state element:

   ```rust title="cw-my-nameservice's state.rs"
   pub const MINTER: OwnershipStore = OwnershipStore::new("name_minter");
   ```
   [&#x1F4C4;](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/state.rs#L12)

2. The `Ownership`'s definition:

   ```rust title="ownable's struct Ownership"
   pub struct Ownership<T: AddressLike> {
       pub owner: Option<T>,
       pub pending_owner: Option<T>,
       pub pending_expiry: Option<Expiration>,
   }
   ```
   [&#x1F4C4;](https://github.com/larry0x/cw-plus-plus/blob/v2.0.0/packages/ownable/src/lib.rs#L16-L29)

3. The instantiation message plus what is in the constructor:

   ```rust title="contract.rs"
   let _ = MINTER.initialize_owner(deps.storage, deps.api, Some(msg.minter.as_str()))?;
   ```
   [&#x1F4C4;](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/contract.rs#L20)

Now that you know that:

1. The minter information is saved at the key `name_minter`.
2. The minter address proper is under `owner`.
3. The value proper is saved in Base64.

You can query the instance's state directly, without the `all` keyword. Either with the key in ASCII:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm contract-state raw $ns_addr1 \
            name_minter --ascii \
            --output json \
            | jq -r '.data' \
            | base64 -D
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm contract-state raw $ns_addr1 \
                name_minter --ascii \
                --output json \
                | jq -r '.data' \
                | base64 -D
        ```
    </TabItem>
</Tabs>

Or with the key in hex:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm contract-state raw $ns_addr1 \
            6E616D655F6D696E746572 --hex \
            --output json \
            | jq -r '.data' \
            | base64 -D
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm contract-state raw $ns_addr1 \
                6E616D655F6D696E746572 --hex \
                --output json \
                | jq -r '.data' \
                | base64 -D
        ```
    </TabItem>
</Tabs>

:::tip

Note that, as always in blockchain, you can query for storage values at different block heights
with the `--height` flag; provided the content was not pruned from storage.

:::

</details>

<details>
    <summary>How was this address computed?</summary>

Your new smart contract's address is probably exactly `wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d` too,
unlike your Alice's address, which is different. This is no lucky guess.

The new address computation takes place during the transaction execution, so let's dive into the Go code of wasmd.

The message server uses the [`ClassicAddressGenerator`](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/msg_server.go#L67).
This generator uses a [simply-incrementing 64-bit number](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/addresses.go#L20)
instance id to count all the instances created by this method.

Then it:

- Takes the [hash](https://github.com/cosmos/cosmos-sdk/blob/v0.50.7/types/address/hash.go#L32) of the string [`module`](https://github.com/cosmos/cosmos-sdk/blob/v0.50.7/types/address/hash.go#L81).
- Appends the [module name](https://github.com/cosmos/cosmos-sdk/blob/v0.50.7/types/address/hash.go#L74) (i.e. [`wasm`](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/addresses.go#L40)).
- Appends the [`0` byte](https://github.com/cosmos/cosmos-sdk/blob/v0.50.7/types/address/hash.go#L80).
- Appends the [8 bytes of the code id](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/addresses.go#L38) big-endian style.
- And appends the [8 bytes of this instance id](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/addresses.go#L39), which [starts at `1`](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/keeper.go#L1256).
- [Hashes](https://github.com/cosmos/cosmos-sdk/blob/v0.50.7/types/address/hash.go#L28) the lot with sha256.

And voilà. After a conversion to bech32, you get your address.

Try it yourself with the help of online tools:

1. The string `module` hashes to: `120970d812836f19888625587a4606a5ad23cef31c8684e601771552548fc6b9` as seen [here](https://emn178.github.io/online-tools/sha256.html?input=module&input_type=utf-8&output_type=hex&hmac_enabled=0&hmac_input_type=hex) or with the command:

    ```shell
    echo -n module | sha256sum --text
    ```

2. `wasm` hex-encodes to `7761736d` as you can confirm [here](http://www.unit-conversion.info/texttools/hexadecimal/#data), or with the command:

    ```shell
    echo -n wasm | xxd -p
    ```

3. The `0` byte encodes to `00`.
4. The instance id of 1 goes first and is, as a 64 bit number, written as `0000000000000001`.
5. The code id, also of 1, goes second and is also written as `0000000000000001`.

Putting it all together, what you need to hash is:

```text
120970d812836f19888625587a4606a5ad23cef31c8684e601771552548fc6b97761736d0000000000000000010000000000000001
```

This yields `ade4a5f5803a439835c636395a8d648dee57b2fc90d98dc17fa887159b69638b` as seen [here](https://emn178.github.io/online-tools/sha256.html?input=120970d812836f19888625587a4606a5ad23cef31c8684e601771552548fc6b97761736d0000000000000000010000000000000001&input_type=hex&output_type=hex&hmac_enabled=0&hmac_input_type=hex) or with the command:

```shell
echo -n 120970d812836f19888625587a4606a5ad23cef31c8684e601771552548fc6b97761736d0000000000000000010000000000000001 \
    | xxd -r -p \
    | sha256sum --binary
```

Now, with this hashed result, you need to compute the bech32 address. Head [here](https://blockchain-academy.hs-mittweida.de/bech32-tool/) and, in the _Encoder_ part, put:

* `wasm`
* `ade4a5f5803a439835c636395a8d648dee57b2fc90d98dc17fa887159b69638b`

Press _Encode_ and on the right you see `wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d`.

Alternatively, you can do the same with wasmd:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd keys parse ade4a5f5803a439835c636395a8d648dee57b2fc90d98dc17fa887159b69638b
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd keys parse ade4a5f5803a439835c636395a8d648dee57b2fc90d98dc17fa887159b69638b
        ```
    </TabItem>
</Tabs>

Congratulations! You have recomputed your smart contract instance address.

:::tip

As a side-note, CosmWasm implements another contract address computation function.
If you come from Ethereum, this is similar to `CREATE2`.
To use it, you would invoke the `tx wasm instantiate2` command, which, in turn, is using
the aptly-named [`PredictableAddressGenerator`](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/addresses.go#L26).
If you want to pre-calculate a future address, you can use the command:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm build-address --help
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd keys query wasm build-address --help
        ```
    </TabItem>
</Tabs>

:::

</details>

## Send a transaction to your contract

The smart contract you just instantiated is made to register names. As your first transaction,
you will register the name `"queen-of-the-hill"` and map it to Alice.
What message does the [`execute` function](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/contract.rs#L29) expect?
It expects this:

```rust title="Execute message in msg.rs"
pub enum ExecuteMsg {
    Register { name: String, owner: Addr },
}
```
[&#x1F4C4;](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/msg.rs#L10-L12)

CosmWasm serializes an enum such as `ExecuteMsg` by prefixing the value proper with the type, here `Register`.
Since you want to register Alice at the name, your register message, with its two fields, is:

```shell
ns_register_queen_to_alice='{"register":{"name":"queen-of-the-hill","owner":"'$alice'"}}'
```

<details>
    <summary>Comfirm that the message looks right</summary>

With:

```shell
echo $ns_register_queen_to_alice
```

Which should return something like:

```text
{"register":{"name":"queen-of-the-hill","owner":"wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as"}}
```

</details>

As can be seen in the `execute_register` function, only the minter can send an `ExecuteMsg::Register` message:

```rust title="Minter gatekeeping in contract.rs"
MINTER
    .assert_owner(deps.storage, &info.sender)
    .map_err(ContractError::from_minter(&info.sender))?;
```
[&#x1F4C4;](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/contract.rs#L42-L44)

And as you recall from the instantiation message, Alice is the minter. So Alice has to send this transaction.
This smart contract does not need funds, but as a vehicle to demonstrate the concept,
you attach funds of **100 stake** to the call:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd tx wasm execute $ns_addr1 "$ns_register_queen_to_alice" \
            --amount 100stake \
            --from alice --keyring-backend test \
            --chain-id learning-chain-1 \
            --gas-prices 0.25stake --gas auto --gas-adjustment 1.3 \
            --yes
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd tx wasm execute $ns_addr1 "$ns_register_queen_to_alice" \
                --amount 100stake \
                --from alice --keyring-backend test \
                --chain-id learning-chain-1 \
                --gas-prices 0.25stake --gas auto --gas-adjustment 1.3 \
                --yes
        ```
    </TabItem>
</Tabs>

Once more, make a note of the transaction hash. For instance:

```shell
ns_register_queen_to_alice_txhash=7966EBDD3766243FFFFE70D0A360305DE11B0BE77A305470D23D376B65432451
```

<details>
   <summary>How did tokens change hands?</summary>

What happened? Let's look at the events that were emitted as part of this registration:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query tx $ns_register_queen_to_alice_txhash \
            --output json \
                | jq ".events"
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query tx $ns_register_queen_to_alice_txhash \
                --output json \
                    | jq ".events"
        ```
    </TabItem>
</Tabs>

There comes a long list of events. Note this particular one:

```json
{
    "type": "transfer",
    "attributes": [
        {
        "key": "recipient",
        "value": "wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d",
        "index": true
        },
        {
        "key": "sender",
        "value": "wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as",
        "index": true
        },
        {
        "key": "amount",
        "value": "100stake",
        "index": true
        },
        {
        "key": "msg_index",
        "value": "0",
        "index": true
        }
    ]
}
```

It is emitted by the bank module and is the trace that tells you that Alice paid the name service contract `100stake`. And indeed, you can confirm that now the smart contract instance holds tokens:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query bank balance $ns_addr1 stake
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query bank balance $ns_addr1 stake
        ```
    </TabItem>
</Tabs>

Which returns:

```yaml
balance:
    amount: "100"
    denom: stake
```

:::warning Oops!

This version of the code of the smart contract cannot send tokens away, so its balance is in effect stranded.
Better care next time...

:::

Now, if you look at how the transaction is built:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query tx $ns_register_queen_to_alice_txhash \
            --output json \
            | jq ".tx.body.messages"
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query tx $ns_register_queen_to_alice_txhash \
                --output json \
                | jq ".tx.body.messages"
        ```
    </TabItem>
</Tabs>

You see a single message:

```json
[
  {
    "@type": "/cosmwasm.wasm.v1.MsgExecuteContract",
    "sender": "wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as",
    "contract": "wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d",
    "msg": {
      "register": {
        "name": "queen-of-the-hill",
        "owner": "wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as"
      }
    },
    "funds": [
      {
        "denom": "stake",
        "amount": "100"
      }
    ]
  }
]
```

Although you see the word `funds` as a field of the message, it does not mean that the bank module will automagically handle that. Instead:

1. At the transaction creation, when you included the extra information `--amount 100stake` in the command line, `wasmd` knew to [add the `funds` field](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/client/cli/gov_tx.go#L437) to the message.
2. The wasm module's message server [extracts the `funds` information](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/msg_server.go#L124) from the message and passes it on to the execution proper.
3. As part of the execution, the module [transfers the coins using the bank module](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/keeper.go#L402); and only continues if these transfers are successful.
4. The module then [crafts the info](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/keeper.go#L408), which includes the implied fact that the funds were collected.
5. The info is [passed to the Wasm VM](https://github.com/CosmWasm/wasmd/blob/v0.52.0/x/wasm/keeper/keeper.go#L413).
6. This jumps to the smart contract, which [receives an info object](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/contract.rs#L28)  that contains the [`funds`](https://github.com/CosmWasm/cosmwasm/blob/v2.1.4/packages/std/src/types.rs#L105) detail.
7. The contract could validate that it was paid enough for the minting. In fact, if you go to [this part](./16-fund-handling.html) of the long-running exercise, you see [it checking](https://github.com/b9lab/cw-my-collection-manager/blob/main/src/contract.rs#L107-L146) exeactly that in the list of funds that have been collected.

</details>

<details>
     <summary>What happened to the storage?</summary>

You can use the same way you used earlier. Call up all storage:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm contract-state all $ns_addr1
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm contract-state all $ns_addr1
        ```
    </TabItem>
</Tabs>

Which returns:

```yaml
models:
- key: 000D6E616D655F7265736F6C766572717565656E2D6F662D7468652D68696C6C
  value: eyJvd25lciI6Indhc20xdGV2Nnh0NHBncm5qcHh3bXZ2N2pybDhwaDR4NDd3ZzV2Y2QwYXMifQ==
- key: 6E616D655F6D696E746572
  ...
```

If you remove the `000D` prefix from the new key and decode it as ASCII:

```shell
echo 6E616D655F7265736F6C766572717565656E2D6F662D7468652D68696C6C | xxd -r -p
```

You get:

```text
name_resolverqueen-of-the-hill
```

This is a concatenation of [the map's name](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/state.rs#L11) and the item's key.

The `00` prefix denotes a key part of a more complex type, while the next `0D` identifies this complex type as a map.

Now if you Base64-decode the value with:

```shell
echo eyJvd25lciI6Indhc20xdGV2Nnh0NHBncm5qcHh3bXZ2N2pybDhwaDR4NDd3ZzV2Y2QwYXMifQ== | base64 -d
```

You get:

```json
{"owner":"wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as"}
```

Which is consistent with the `NameRecord`:

```rust title="state.rs/NameRecord"
pub struct NameRecord {
    pub owner: Addr,
}
```
[&#x1F4C4;](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/state.rs#L7-L9)

</details>

## Send a query to your contract

Has the name been duly registered, and is there a convenient way to verify? Yes, first create the resolve message so that it follows the expected query type:
[&#x1F587;](https://github.com/b9lab/cw-my-nameservice/blob/add-first-library/src/msg.rs#L16-L19)
```rust title="msg.rs/QueryMsg"
pub enum QueryMsg {
    ResolveRecord { name: String },
}
```


This is another `enum` which again is serialized by prefixing with the snake-case variant:

```shell
ns_resolve_queen='{"resolve_record":{"name":"queen-of-the-hill"}}'
```

Then you pass it as a query to the smart contract:

<Tabs groupId="local-docker">
    <TabItem value="Local" default>
        ```shell
        ./build/wasmd query wasm contract-state smart $ns_addr1 "$ns_resolve_queen"
        ```
    </TabItem>
    <TabItem value="Docker">
        ```shell
        docker exec val-alice-1 \
            wasmd query wasm contract-state smart $ns_addr1 "$ns_resolve_queen"
        ```
    </TabItem>
</Tabs>

Which returns as expected:

```yaml
data:
  address: wasm1tev6xt4pgrnjpxwmvv7jrl8ph4x47wg5vcd0as
```

Congratulations! You have updated the name service smart contract and confirmed it.

## Conclusion

Here is a summary of what you accomplished:

- You compiled a blockchain that supports CosmWasm.
- You initialized and ran it.
- You compiled a smart contract.
- You stored a bytecode on-chain.
- You instantiated a smart contract using your bytecode.
- You had your smart contract save information in its state with the use of a transaction.
- You interrogated your smart contract about its state with the use of a query.

If you did not on the first pass, go back and expand the collapsed sections to learn more.

If you are keen on doing a couple of other hello-world-like exercises before plunging into smart contract writing,
try Neutron's [Remix IDE's tutorial](https://docs.neutron.org/tutorials/cosmwasm_remix) or [WasmKit's tutorial](https://docs.neutron.org/tutorials/cosmwasm_wasmkit).

If you feel ready to start an exercise that will take you from creating your own smart contract,
to testing it and managing it, head to the next section: [first contract](./05-first-contract.md).
