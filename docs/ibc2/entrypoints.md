---
title: Entrypoints
sidebar_position: 2
---

# Entrypoints in IBCv2

IBCv2 introduces four primary entry points for smart contracts interacting via the Inter-Blockchain
Communication protocol. These entry points define how contracts handle incoming packets, timeouts,
acknowledgements, and outbound messages. Each of these entry points plays a critical role in
enabling robust, verifiable, and asynchronous cross-chain communication between smart contracts via IBCv2.

## Receive entrypoint

```rust
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc2_packet_receive(
    deps: DepsMut,
    env: Env,
    msg: Ibc2PacketReceiveMsg,
) -> StdResult<IbcReceiveResponse> {
    // [...]
    Ok(IbcReceiveResponse::new(StdAck::success(b"\x01")))
}
```

The `ibc2_packet_receive` function is invoked when an IBCv2 packet is received on a port ID associated
with the contract instance.

The **`Ibc2PacketReceiveMsg`** includes:

- the packet payload data,
- the relayer address,
- the source client ID,
- the unique packet sequence number.

This entry point allows the contract to process incoming cross-chain messages.

There are two options for sending acknowledgements:

- Send a synchronous acknowledgement immediately using, for example, `IbcReceiveResponse::new(StdAck::success(b"\x01"))`.
- Defer the acknowledgement for [asynchronous processing](message-passing#asynchronous-acknowledgements) using `IbcReceiveResponse::without_ack()`.

## Timeout entrypoint

```rust
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc2_packet_timeout(
    deps: DepsMut,
    env: Env,
    msg: Ibc2PacketTimeoutMsg,
) -> StdResult<IbcBasicResponse> {
    // [...]
    Ok(IbcBasicResponse::default())
}
```

This function is triggered when a packet sent by the contract is proven not to have been received or
processed by the destination chain. It serves as a fallback mechanism in case of connection issues.

The **`Ibc2PacketTimeoutMsg`** provides:

- the original packet payload,
- source and destination client IDs,
- the packet sequence number,
- the relayer address.

## Acknowledgement entrypoint

```rust
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc2_acknowledge_receive(
    deps: DepsMut,
    env: Env,
    msg: Ibc2PacketAckMsg,
) -> StdResult<IbcBasicResponse> {
    // [...]
    Ok(IbcBasicResponse::default())
}
```

When an acknowledgement for a previously sent packet is received, this entry point is called.

The **`Ibc2PacketAckMsg`** contains:

- source and destination client IDs,
- the relayer address,
- the acknowledgement response data,
- the payload of the original packet.

This allows the contract to confirm and act upon the acknowledgement of a sent message.

## Send entrypoint

```rust
#[cfg_attr(not(feature = "library"), entry_point)]
pub fn ibc2_packet_send(
    deps: DepsMut,
    env: Env,
    msg: Ibc2PacketSendMsg,
) -> StdResult<IbcBasicResponse> {
    // [...]
    Ok(IbcBasicResponse::default())
}
```

To support permissionless packet sending, IBCv2 introduces the `ibc2_packet_send` entry point.
This function allows the contract to validate outbound messages initiated from its associated port.

The **`Ibc2PacketSendMsg`** includes:

- source and destination client IDs,
- packet sequence number,
- signer address,
- message payload.
