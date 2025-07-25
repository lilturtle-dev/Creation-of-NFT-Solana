import {
  createNft,
  findMetadataPda,
  mplTokenMetadata,
  verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createGenericFile,
  generateSigner,
  keypairIdentity,
  percentAmount,
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
import { promises as fs } from "fs";
import * as path from "path";
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

// convert to umi compatible keypair
const umiKeypair = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

// load our plugins and signer
umi
  .use(keypairIdentity(umiKeypair))
  .use(mplTokenMetadata())
  .use(irysUploader());

  // Substitute in your collection NFT address from create_collection.ts
  const collectionNftAddress = UMIPublicKey("GzguXDtqQ6hUQxTUSL8NMgnTFFgnFabLAM4rvyrK7UNj");

  // example data and metadata for our NFT
  const nftData = {
    name: "Lil Turtle",
    symbol: "LIL",
    description: "Small turtle with a big heart",
    sellerFeeBasisPoints: percentAmount(0),
    imageFile: "lil_turtle.avif",
  }

  const NFTImagePath = path.resolve(__dirname, "lil_turtle.avif");

  const buffer = await fs.readFile(NFTImagePath);
  let file = createGenericFile(buffer, NFTImagePath, {
    contentType: "image/avif",
  });

  // upload image and get image uri
  const [image] = await umi.uploader.upload([file]);
  console.log("image uri:", image);

  // upload offchain json using irys and get metadata uri
  const uri = await umi.uploader.uploadJson({
    name:"Lil Turtle",
    symbol: "LIL",
    description: "Small turtle with a big heart",
    image,
  });
console.log("NFT offchain metadata URI:", uri);

// generate mint keypair
const mint = generateSigner(umi);

//create and mint NFT
await createNft(umi, {
    mint,
    name: nftData.name,
    symbol: nftData.symbol,
    uri,
    updateAuthority: umi.identity.publicKey,
    sellerFeeBasisPoints: percentAmount(0),
    collection: {
        key: collectionNftAddress,
        verified: false,
    },
}).sendAndConfirm(umi, { send: { commitment: "finalized" } });

let explorererLink = getExplorerLink("address", mint.publicKey, "devnet");
 
console.log(`💵 Token Mint : ${explorererLink}`);