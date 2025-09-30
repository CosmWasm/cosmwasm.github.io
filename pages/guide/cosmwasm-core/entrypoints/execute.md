# Execute

Execute pretty much does what it says on the tin: it executes some routine in your contract
after a remote (either another contract or some client) sent a message.

This function is called when someone wants you to, for example, increment a counter
or add a user to a lottery. Anything that might modify the state of the contract.

## Definition

::: code-group

```Rust [contract.rs]
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
  // TODO: Put your "business" logic here.
  Ok(Response::new())
}
```

:::
