<SectionLabel chapter="core" section="entrypoints"></SectionLabel>

# Sudo

`sudo` is a special entrypoint that you will probably rarely use in practice.

This is where you will receive messages issued _**by the chain itself**_,
and it will never be invoked by clients or other contracts.

And since these are special messages you will only receive from the chain,
the messages you will receive are not defined by yourself,
and instead usually provided by some sort of chain SDK.

## Definition

::: code-group

```Rust [contract.rs]
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn sudo(
    deps: DepsMut, 
    env: Env,
    msg: SudoMsg) -> StdResult<Response> {
    // TODO: Put your administration logic here.
    Ok(Response::default())
}
```

:::
