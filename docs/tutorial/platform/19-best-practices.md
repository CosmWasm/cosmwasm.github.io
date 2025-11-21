---
title: Best practices
description: A collection of what to do and not to do.
---

# Best practices

Going through the concepts and the exercises should have given you an idea of what to do and not to do.
Nonetheless, it is always a good idea to collect these ideas into a singular place, here.

## Preparing code

When creating your project, you should make sure that its code can be reused as a crate by others.
This means that in particular, you ought to add the entry point flag _conditionally_ like so:

```rust
#[cfg_attr(not(feature = "library"), entry_point)]
```

Also, you should inscribe your smart contract's version in the `instantiate` function from the start with:

```rust
set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
```

To see it being done (though a bit too late), see the exercise's [migration part](./18-migration.md).

Your code is always at risk of becoming large and unwieldy, which is one way bugs hide.
To avoid this fate, you ought to split code elements judiciously.
In particular, you may consider a combination of the following:

- Sending Rust unit tests into their own module file.
- Keeping the `execute` function short by having only a `match` statement in it.
- Sending the _sub_-execute functions into their own files.

## State handling

Do not forget to update all the relevant state before exiting.

* There is of course the classic case where a single state entry needs to be updated (think balance update).
* But there is also the case where two state entries need to be updated when something changes on either one
  ([think sale and trade](https://github.com/oak-security/cosmwasm-security-dojo/blob/68527006200e269fc8386a3e1b7c4799e2a6cd19/challenges/04-nft/src/contract.rs#L282-L285)).

## Addresses

Addresses and strings tend to be used interchangeably in CosmWasm but there are still risks.

1. Ensure input addresses are valid. In particular, you should 
   [deserialize user inputs](https://github.com/DA0-DA0/dao-contracts/wiki/CosmWasm-security-best-practices#dont-deserialize-into-addr) into `String`,
   and then use [`Api.addr_validate`](https://github.com/CosmWasm/cosmwasm/blob/v2.1.4/packages/std/src/traits.rs#L157) before going further.
2. Beware un-normalized addresses. In particular, you should use [`Api.addr_validate`](https://github.com/CosmWasm/cosmwasm/blob/v2.1.4/packages/std/src/traits.rs#L157)
   to normalize addresses if any comparison is required. Otherwise, for instance, a different capitalization can help
   [escape detection](https://github.com/oak-security/cosmwasm-security-dojo/blob/main/challenges/05-addressing/src/exploit.rs#L82).

## Funds handling

When expecting and receiving funds, your code should never confuse between:

1. The value transferred as part of a transaction.
2. The total amount that is saved to state after the transaction is complete.

In particular:

- If you are receiving payment, then what matters is the value that comes with the transaction.
- If you are verifying a status, such as staked amount, what matters is the stored state, perhaps even one snapshot in the past.
  In particular, you want to be [resistant to flash loans](https://github.com/DA0-DA0/dao-contracts/wiki/CosmWasm-security-best-practices#your-attackers-have-unlimited-capital).

In practice, this means:

- If your code holds funds on behalf of other users, it should not have to query its own balance with the bank module
  as its balance represents an aggregate. Instead, it should store in its own state the relevant values.
  See [this hacking challenge](https://github.com/oak-security/cosmwasm-security-dojo/tree/main/challenges/01-storewhat)
  for an example of when it goes wrong.
- Your code should be able to handle any combination of funds being passed to it.
  For instance, you may expect a payment of `10 stake`. In that case, your code needs to accept being paid with two payments,
  the first of `1 stake` and the other of `9 stake`. And any other condition. To see this concept applied, 
  go to the exercise on [fund handling](./16-fund-handling.md). A rationale for this practice is that another smart contract,
  the one paying yours, may have poorly assembled a strange but nonetheless-suitable internal message.
  Another rationale is that, in a possible future, two externally-owned accounts would each pay part of the fee.
- Your code should also be able to return the change on a payment that is too high.
  The rationale for it is that your fee may decrease, but your users take time to notice.
- If, on the contrary, you make your smart contract only accept an exact unique payment, this decision
  has to be made explicitly, because of the necessities of your project, and not because it's just easier.
- Your code should be able to handle irrelevant funds being transferred to it.
  - Either by atomically returning the change on an expected payment.
  - Or by having a privileged account withdraw all unaccounted funds, considering them as donations.
  - Or by rejecting the transaction as a whole.
- If you choose to fail when receiving irrelevant funds, this decision has to be made explicitly,
  because of the necessities of your project, and not because it's just easier.

## Testing

## Gas limit

Even if individual WebAssembly operations are cheap in terms of gas, they are not free.
And using the underlying app-chain elements is all metered.

- The most expensive operations are about access to storage. So avoid storing (and retrieving) a full list to (from) storage
  when all you need at decision time is a single value. For instance, if you have a whitelist,
  it is cheaper to use a map than to store the entire list as a single storage item.
  - So instead of `Item<Vec<Addr>>`,
  - Use `Map<&Addr, bool>`.
- Beware of operations whose gas cost increases with usage (`> O(1)`). If for instance, you store a list as a single item,
  and this list can be enlarged by a user, there will come a time when the list is too large to store or retrieve.
  At this stage, the transaction will fail for lack of gas. The limit here is not the transaction's gas,
  which the sender can choose to increase. Instead, the limit is the block's gas limit, which is high, but still finite.
  What to watch out for includes `for` loops where the number of times it loops through is not known in advance.
  Also remember, that in Rust, there are hidden loops such as array and slice `contains` method.

Another gas saving trick is to store zipped code. If, even after using [the optimizer](https://github.com/CosmWasm/optimizer),
your code is large, you can zip it and pass the [zipped result](https://github.com/CosmWasm/wasmd/blob/v0.53.0/proto/cosmwasm/wasm/v1/tx.proto#L95-L96)
as part of the `MsgStoreCode` transaction.

## Calculations

When you instruct your smart contract to do calculations, it is using integers.
Prevent overflows by using the functions of `Uint128` for instance, and threshold effects.

## Libraries

If you want your smart contract to send messages to a Cosmos SDK module for which the bindings do not yet exist,
you can use the [Anybuf crate](https://docs.rs/anybuf/latest/anybuf/). Protobuf is indeed the serialization method
used by the Cosmos SDK messages. See [this example](https://github.com/noislabs/nois-contracts/blob/v0.13.6/contracts/nois-payment/src/contract.rs#L115-L116),
where:

- The Protobuf [`type_url` is declared](https://github.com/noislabs/nois-contracts/blob/v0.13.6/contracts/nois-payment/src/contract.rs#L115)
  following [its declaration](https://github.com/cosmos/cosmos-sdk/blob/v0.52.0-rc.1/x/distribution/proto/cosmos/distribution/v1beta1/tx.proto#L2).
- The elements of the message [are appended](https://github.com/noislabs/nois-contracts/blob/v0.13.6/contracts/nois-payment/src/contract.rs#L135-L136)
  according to [the definition](https://github.com/cosmos/cosmos-sdk/blob/v0.52.0-rc.1/x/distribution/proto/cosmos/distribution/v1beta1/tx.proto#L142-L148).
