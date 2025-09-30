# Instantiate

This is one of the most fundamental entrypoints. This entrypoint is called once during the contract lifecycle,
right after an address has been assigned. It essentially is there to initialise the state of your contract
(for example, initialising a counter in storage, etc.).

You can imagine it as the constructor of your contract.

::: tip :bulb: Tip

Note that this function is called for **each instance** of your contract that you decide to create,
not one time ever.

To equate it to object-oriented programming, your contract is a **class**, and instantiate entrypoint
is the **constructor**, and you can have **multiple instances** (objects) of the same class,
and the constructor must be called exactly once for every one of these instances.

It is **not** a singleton class.

:::

## Definition

::: code-group

```Rust [contract.rs]
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    // TODO: Put your initialization logic here.
    Ok(Response::new())
}
```

:::
