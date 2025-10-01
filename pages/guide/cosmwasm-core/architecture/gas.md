[#1599]: https://github.com/CosmWasm/cosmwasm/pull/1599
[JSON numbers]: https://www.json.org/
[default-gas-multiplier]: https://github.com/CosmWasm/wasmd/blob/04cb6e5408cc54c27247b0b327dfa99769d5103c/x/wasm/types/gas_register.go#L34
[inspired by NEAR]: https://docs.near.org/concepts/protocol/gas
[#1120]: https://github.com/CosmWasm/cosmwasm/pull/1120

# Gas

Gas is a way to measure computational expense of a smart contract execution, including CPU time and
storage cost. Gas unit is 1, i.e. you can think of it as countable points. Gas consumption is
deterministic, so executing the same code costs the same amount of gas across all hardware and
operating systems.

## CosmWasm gas versus Cosmos SDK gas

CosmWasm charges gas for:
- Wasm operations,
- calls to host functions,
- calls to the Cosmos SDK.

_**CosmWasm gas**_ is different from _**Cosmos SDK gas**_ as the numbers in CosmWasm are much larger.
Since we charge gas for arbitrary user defined operations, we need to charge each Wasm operation
individually and cannot group larger tasks together. As a result, the gas values become much larger
than in Cosmos SDK even for very fast executions. There is a [multiplier][default-gas-multiplier]
to translate between _**Cosmos SDK gas**_ and _**CosmWasm gas**_.
It was measured and set to `140 000` a while ago and can be adjusted when necessary.

## CosmWasm gas pricing

For CosmWasm gas, the target gas consumption is **1 Teragas per second** (Tera = $10^{12}$).
This idea is [inspired by NEAR]; see their excellent documentation for more details. Summarizing:

$$ 1\ Teragas = (shortly)\ 1\ Tgas  = 10^{12}\ gas $$

In order to meet this target, we execute Argon2 in a test contract ([#1120]). This is a CPU and
memory intense job that does not call out into the host. At a constant gas cost per operation of 1
(before CosmWasm 1.0), this consumed **96837752** gas and took 15 ms on our CI system.
The ideal cost per Wasm operation for this system is:
 
$$ {10^{12} :  {96837752 \over {15 \times 10^{-3}}}} = 154 $$
 
This is rounded to $\lfloor 154 \rfloor = \mathbf{150}$ for simplicity.

**CosmWasm 2.1 update**

All gas values were re-evaluated and adjusted to meet the **1 Teragas per second** target mentioned above.
A rerun of the Argon2 test contract consumed **5270718300** gas with the
previous cost of 150, so the operation count was:
 
$$ {5270718300 \over 150} = 35138122 $$
 
This took 6 ms on our benchmark server, so the new cost per operation is:
 
$$ {10^{12} : {35138122 \over {6 \times 10^{-3}}}} = 171 $$

This is rounded to $\lfloor 171 \rfloor = \mathbf{170}$ for simplicity.

## Benchmarking system

- CPU: Intel® Core™ i7-6700 CPU @ 3.40GHz (4 cores, 8 threads)
- RAM: 32GB DDR4 2133 MHz

Each machine is different, this is obvious. But the above model helps us in multiple ways:

- develop an intuition what it means to burn N units of gas or how much gas can be used if a block
  should be executable in 1 second,
- have a target for adjustments when the Wasm runtime becomes faster or slower,
- allow pricing of calls that are not executed in Wasm, such as crypto APIs or Cosmos APIs,
- find significant over- or underpricing.

## Gas overflow potential

CosmWasm gas aims for **1 Teragas per second**, which means that the 64-bit unsigned integer range exceeds
after 18 million seconds:
 
$$ \frac{2^{64} - 1}{10^{12}} \approx 18446744\ seconds \approx 5124\ hours \approx 213\ days $$

Assuming a maximal supported block execution time of 30 seconds, the gas price has to be overpriced
by a factor of **614891** in order to exceed the 64-bit unsigned integer range:

$$ \frac{2^{64} - 1}{30 \times 10^{12}} \approx 614891\ {Teragas \over s} $$


Since serious over- or underpricing is considered a bug, using 64-bit unsigned integer
for gas measurements is **considered safe**.

Cosmos SDK gas uses values that are smaller by a factor of 170, so those don't overflow as well.
Since no Cosmos SDK gas values are processed inside of this repository, this is not our main
concern. However, it's good to know that we can safely pass them in 64-bit fields, as long as the
full range is supported. This is the case for the C API as well as [JSON numbers] as long as both
sides support integers in their JSON implementation. Go and Rust do that while many other
implementations don't support integers, and convert them to IEEE–754 doubles, which has a safe
integer range up to about 53 bit (e.g. JavaScript and jq).

## Gas changes in CosmWasm

In all versions before 2.0, the gas values were bigger by a factor of **1000**.
There is no need to have them this big and in order to reduce the risk of
overflow, the gas values were lowered in this issue [#1599].

Below is a breakdown of what this change entails:

|                                                     | CosmWasm 1.x | CosmWasm 2.0 | CosmWasm 2.1 |
|-----------------------------------------------------|:------------:|:------------:|:------------:|
| **Cost target**                                     |  1 Tgas/ms   |   1 Tgas/s   |   1 Tgas/s   |
| **Exceeds 64-bit unsigned<br/>integer range after** |   5 hours    |  5124 hours  |  5124 hours  |
| **Cost per Wasm operation**                         |   150.000    |     150      |     170      |
| **Multiplier**                                      | 140.000.000  |   140.000    |   140.000    |
