import React, {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
    title: string;
    Svg: React.ComponentType<React.ComponentProps<'svg'>>;
    description: ReactNode;
};

const FeatureList: FeatureItem[] = [
    {
        title: 'Security',
        Svg: require('@site/static/img/cosmwasm-small.svg').default,
        description: (
            <>
                CosmWasm aims to address many of the security issues present in Ethereum/Solidity.
                It does this by preventing reentrancy attacks, a common exploit in the DeFi world.
                It also provides a more streamlined experience for migrating contracts, as opposed to using
                a “proxy contract” pattern. And it removes many language elements which tended
                to be misused (like tx.origin for security).
                Overall, CosmWasm provides a highly secure foundation for smart contracts
                on the Cosmos ecosystem by preventing the most common classes of attacks found in Solidity.
            </>
        ),
    },
    {
        title: 'Testing',
        Svg: require('@site/static/img/cosmwasm-small.svg').default,
        description: (
            <>
                Unit testing in Solidity can be challenging due to the unique characteristics
                of the Ethereum virtual machine and the Solidity programming language.
                However, CosmWasm makes testing more accessible by making it a first-class citizen from the start.
                It provides support for multiple levels of testing, including unit, integration,
                and full-stack tests. This allows developers to test their critical business logic more comprehensively
                and effectively, and improve their smart contracts’ overall reliability and security.
                CosmWasm also makes it easy to provide solid coverage of the business logic,
                which is a crucial aspect of ensuring the reliability and security of smart contracts.
            </>
        ),
    },
    {
        title: 'Performance',
      Svg: require('@site/static/img/cosmwasm-small.svg').default,
        description: (
            <>
                CosmWasm is designed to handle high transaction throughput, and can quickly process several
                hundred transactions per second.
                This allows for faster and more efficient execution of smart contract operations,
                particularly useful in high-demand use cases.
                Additionally, CosmWasm is deployed on multiple, connected chains, which helps to split
                the load and keep costs low. By spreading the load across multiple chains, CosmWasm can reduce
                the strain on any single chain, which helps to keep costs down and improve the overall scalability
                of the platform. This benefits developers and users, allowing for more efficient
                and cost-effective execution of smart contract operations.
            </>
        ),
    },
    {
        title: 'Composability',
        Svg: require('@site/static/img/cosmwasm-small.svg').default,
        description: (
            <>
                CosmWasm provides the ability to compose smart contracts, similar to Ethereum, but with additional
                architectural support to make it safer and more secure.
                This support allows developers to build complex compositions of smart contracts, like the Mars Protocol.
                This protocol enables the creation of customizable, composable, and reusable smart contract templates
                that can be used to build more complex and sophisticated applications.
                The added safety and security features in CosmWasm help to mitigate the risk of errors and vulnerabilities
                in these complex compositions, making it a more reliable platform for building and deploying these kinds of applications.
            </>
        ),
    },
    {
        title: 'Flexibility',
        Svg: require('@site/static/img/cosmwasm-small.svg').default,
        description: (
            <>
                In Ethereum, there is no method to compose across multiple chains or migrate a project to another blockchain.
                However, building upon the Cosmos SDK and IBC, CosmWasm provides such power.
                If your project becomes too large and you want to move to your own sovereign chain,
                you can quickly launch a new CosmWasm chain with IBC baked in. You can then iterate on new multi-chain
                protocols as CosmWasm contracts allow users to opt-in to your new chain, while still maintaining
                a first class connection to protocols on the original chain.
            </>
        ),
    },
    {
        title: 'Interoperability',
        Svg: require('@site/static/img/cosmwasm-small.svg').default,
        description: (
            <>
                Built for a multi-chain, cross-chain world, and deeply integrated with Inter Blockchain Communication.
                When you keep your money in your bank, you can easily send it to your friend who has another bank.
                In the crypto world, it should work the same. Your coin and/or NFT on chain A should be easily moved to chain B seamlessly.
                Not only that, you can imagine all the crazy stuff in the multi-chain future: a DAO on Juno chain can mint an NFT
                on Stargaze chain, then LP their treasury on Osmosis, and exchange it with Ethereum over Axelar…
            </>
        ),
    },
];

function Feature({title, Svg, description}: FeatureItem) {
    return (
        <div className={clsx('col col--4')}>
            <div className="text--center">
                <Svg className={styles.featureSvg} role="img"/>
            </div>
            <div className="text--center padding-horiz--md">
                <Heading as="h3">{title}</Heading>
                <p className="text--justify">{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures(): ReactNode {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
