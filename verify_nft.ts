import {
    findMetadataPda,
    mplTokenMetadata,
    verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import {
    keypairIdentity,
    publicKey as UMIPublicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
    airdropIfRequired,
    getExplorerLink,
    getKeypairFromFile,
} from "@solana-developers/helpers";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

// create a new connection to Solana's devnet cluster
const connection = new Connection(clusterApiUrl("devnet"));

// load keypair from local file system
// assumes that the keypair is already generated using `solana-keygen new`
const user = await getKeypairFromFile("keypair.json");
console.log("Loaded user:", user.publicKey.toBase58());

await airdropIfRequired(
    connection,
    user.publicKey,
    1 * LAMPORTS_PER_SOL,
    0.1 * LAMPORTS_PER_SOL,
);

const umi = createUmi(connection);

// convert to Umi compatible keypair
const signer = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

// load the MPL metadata program plugin and assign a signer to our umi instance
umi.use(keypairIdentity(signer)).use(mplTokenMetadata());

// Substitute in your collection NFT address from create-metaplex-nft-collection.ts
const collectionAddress = UMIPublicKey("GzguXDtqQ6hUQxTUSL8NMgnTFFgnFabLAM4rvyrK7UNj");

// Substitute in your NFT address from create-metaplex-nft.ts
const nftAddress = UMIPublicKey("Fi7k14vvVHbKFT7wyGWjoPh6wbjaBT1RCXNm5WD7miCq");

// Verify our collection as a Certified Collection
// See https://developers.metaplex.com/token-metadata/collections

const metadata = findMetadataPda(umi, { mint: nftAddress });
await verifyCollectionV1(umi, {
    metadata,
    collectionMint: collectionAddress,
    authority: umi.identity,
}).sendAndConfirm(umi);

let explorerLink = getExplorerLink("address", nftAddress, "devnet");
console.log(`Verifed collection for NFT: ${explorerLink}`);
console.log("✅ Collection verified successfully!");