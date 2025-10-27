# CosmWasm Platform Tutorials

This section contains a comprehensive set of tutorials originally from the CosmWasm Developer Platform. These tutorials provide hands-on, step-by-step guidance for learning CosmWasm smart contract development.

## Overview

These tutorials follow a progressive learning path from fundamental concepts to advanced topics. Each tutorial builds upon the previous ones, making it easy to follow along and learn at your own pace.

## Tutorial Structure

### Introduction and Concepts

1. **[Introduction](./01-intro)** - Learn what CosmWasm is and why it exists
2. **[Concepts Overview](./02-concepts-overview)** - Deep dive into CosmWasm's architecture and concepts
3. **[Integration into Cosmos](./03-integration)** - Understand how CosmWasm integrates with the Cosmos SDK
4. **[Hello World](./04-hello-world)** - Build your first CosmWasm smart contract

### Learning By Doing - Inwards

5. **[First Contract](./05-first-contract)** - Create your first real contract
6. **[First Execute Transaction](./06-first-contract-register)** - Execute transactions with your contract
7. **[First Contract Query](./07-first-contract-query)** - Query your contract's state
8. **[First Integration Test](./08-first-contract-test)** - Write tests for your contract
9. **[First Composed Response](./09-first-response)** - Handle complex responses
10. **[Use the Ownable Library](./10-use-library)** - Leverage existing libraries
11. **[Use the NFT Library](./11-use-large-library)** - Work with larger, more complex libraries

### Further Doing - Outwards

12. **[First Contract Integration](./12-cross-contract)** - Call other contracts
13. **[First Contract Query Integration](./13-cross-query)** - Query other contracts
14. **[First Contract Reply Integration](./14-contract-reply)** - Handle asynchronous replies
15. **[First Cross-Module Integration](./15-cross-module)** - Interact with Cosmos SDK modules
16. **[Proper Funds Handling](./16-fund-handling)** - Manage tokens and funds securely

### Deploy and Maintain

17. **[First Sudo Message](./17-sudo-msg)** - Implement privileged functions
18. **[First Migration](./18-migration)** - Upgrade your contracts

### Further Study

19. **[Best Practices](./19-best-practices)** - Learn recommended patterns and practices

## Getting Started

:::caution Version Compatibility
These tutorials reference specific versions of wasmd and CosmWasm:
- The tutorials use **wasmd v0.53.2** with some code links referencing v0.52.0/v0.53.0
- Current documentation uses **wasmd v0.52.0** as an example version
- Rust version **1.80.1** is used in the tutorials
- Some code references point to older versions of CosmWasm/wasmd

The core concepts remain valid, but you may need to adjust:
- Version numbers in git clone commands
- CLI command syntax (which has remained relatively stable)
- Some API references

For the most up-to-date installation and setup instructions, see:
- [Wasmd Setup Guide](../../wasmd/getting-started/setup)
- [Core Installation Guide](../../core/installation)
:::

:::note Formatting Differences
These tutorials are in their original format from the CosmWasm Developer Platform. Some features may work differently:

- **Interactive components** like Accordions, TabGroups, and HighlightBoxes may appear as plain text or have different styling
- **Code blocks** should still display correctly
- **Core content** remains intact and valuable

If you encounter rendering issues with these tutorials, consider referring to our standard [Writing Contracts](../writing-contracts/introduction) tutorials instead.
:::

Start with the [Introduction](./01-intro) to understand the fundamentals, then follow the numbered sequence for the best learning experience.

## Additional Resources

- For our own step-by-step tutorials, check out the [Writing Contracts](../writing-contracts/introduction) section
- For reference documentation, see the [Core documentation](../../core/introduction)
- For other learning resources, visit the [Learning Resources](../learning-resources) page
