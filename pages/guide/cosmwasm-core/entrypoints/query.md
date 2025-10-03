<SectionLabel chapter="core" section="entrypoints"></SectionLabel>

# Query

In the previous section we talked about the [`execute`](./execute) entrypoint.
The `query` entrypoint is actually pretty similar to its sibling [`execute`](./execute),
but with one key difference: the storage is only accessible **immutably**.

This means you can only _**read**_ from the storage but not _**write**_ to it.

## Properly defining a message

When defining a message for queries, you always return some value.
To properly document these return values, you'll want to define them in your schema.

This is where the `cosmwasm_schema::QueryResponses` derive macro comes in.

::: code-group

```Rust [contract.rs]
#[cw_serde]
struct GreetResponse {
  message: String,
}

#[cw_serde]
struct GoodbyeResponse {
  message: String,
}

#[cw_serde]
#[derive(QueryResponses)]
enum CustomQueryMsg {
  #[returns(GreetResponse)]
  Greet,
  #[returns(GoodbyeResponse)]
  Goodbye,
}
```

:::

The macro then defines the required code to document the responses in your code properly,
so you can easily generate, for example, TypeScript types for your contract clients.

## Definition

::: code-group

```Rust [contract.rs]
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(
    deps: Deps,
    env: Env,
    msg: QueryMsg,
) -> StdResult<QueryResponse> {
  // TODO: Prepare the response here.
  Ok(QueryResponse::default())
}
```

:::
