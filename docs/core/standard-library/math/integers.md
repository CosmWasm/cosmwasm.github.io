---
sidebar_position: 2
---

# Integers

CosmWasm offers integer types starting at 64 bit precision, all the way up to 512 bits.

Reasoning behind wrapping the primitive 64 bit type is the interaction with, for example, JavaScript
(same goes for parsers like `jq` or any parser that parses numbers into double precision floats). A
`u64` would normally serialize into a regular integer field in JSON. The issue here is that, due to
representing integers in form of double precision floats, JavaScript can only handle up to ~53 bit
numbers without potentially losing information.

:::tip

There is nothing wrong with using the primitive 64- and 128-bit types in your contract for
calculations. The issues mentioned here can only happen when you de-/serialize these values.

:::

Our wrapper fixes this by serializing numbers as strings, letting JavaScript clients deserialize
these numbers into their respective BigInteger types.

The other integer types, which reach even higher amounts of precision, are serialized in the same way.

Integers come in the following variants:

| Length  | Unsigned | Signed |
|---------|----------|--------|
| 64-bit  | Uint64   | Int64  |
| 128-bit | Uint128  | Int128 |
| 256-bit | Uint256  | Int256 |
| 512-bit | Uint512  | Int512 |
