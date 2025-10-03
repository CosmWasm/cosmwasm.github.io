---
sidebar_position: 1
---

# Decimals

CosmWasm offers decimal types for handling fractional numbers.

In contrast to floating point numbers, these datatypes do not suffer from the same precision issues.
This means that these decimal types are safe for use in financial calculations.

Instead of storing numbers in the floating point format, which gives it a _floating_ amount of
decimal places, these decimal types have a fixed precision of 18 decimal places.

:::tip

Note that, due to how the decimal types are structured, the value ranges can seem a little weird.
   
For example, 128-bit unsigned decimal value $1.0$ is represented by `Decimal(1_000_000_000_000_000_000)`.

The maximal value of the 128-bit unsigned decimal is: 
$$
{2^{128} - 1 \over 10^{18}} = 340282366920938463463.374607431768211455
$$

In practice, you don't really have to think about it, but it's something you should be aware of.

:::

Decimal types come in the following variants:

| Length  | Unsigned   | Signed           |
|---------|------------|------------------|
| 128-bit | Decimal    | SignedDecimal    |
| 256-bit | Decimal256 | SignedDecimal256 |

Choose one of the types according to your needs and off you go!
