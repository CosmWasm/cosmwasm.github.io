[`cw-plus` contracts]: https://github.com/CosmWasm/cw-plus
[`cw4-stake` contract]: https://github.com/CosmWasm/cw-plus/blob/48bec694521655d5b3e688c51e4185f740ea4640/contracts/cw4-stake/Cargo.toml#L22-L24

# Library feature

In the ecosystem, there is the convention to gate the entrypoints of your contract behind a
compile-time feature. The feature is conventionally called `library`.

So instead of using the `#[entry_point]` macro directly, you should do this:

::: code-group

```Rust [contract.rs]
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    Ok(Response::new())
}
```

:::

::: tip :bulb: Tip
You can see this in action in the [`cw-plus` contracts]. Here is an example in the [`cw4-stake` contract].
:::

The rationale behind this is that currently using `#[entry_point]` exports special symbols from the binary,
and these symbols **must** be unique.

That means if you have two `instantiate` endpoints annotated with `#[entry_point]` _somewhere_ in your project
(that includes all your dependencies!), your contract will fail to compile.

Using this library feature will enable developers to use your contract as a dependency and reuse your code.
