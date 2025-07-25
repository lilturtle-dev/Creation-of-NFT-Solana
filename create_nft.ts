import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { keypairIdentity, percentAmount } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { clusterApiUrl } from "@solana/web3.js";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { promises as fs } from "fs";

const umi = createUmi(clusterApiUrl("devnet"));

//load keypair from local file system
// See https://github.com/solana-developers/helpers?tab=readme-ov-file#get-a-keypair-from-a-keypair-file
const localKeypair = await getKeypairFromFile('keypair.json');

// convert to Umi compatible keypair
const umiKeypair = umi.eddsa.createKeypairFromSecretKey(localKeypair.secretKey);

// load the MPL metadata program plugin and assign a signer to our umi instance
umi.use(keypairIdentity(umiKeypair)).use(mplTokenMetadata());

let filePath = "lil_turtle.avif";
const buffer = createGenericFile(Buffer, filePath, {
    // chose the correct file MIME type https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
    contentType: "image/avif",
});
const [image] = await umi.uploader.upload([file]);

const uri = await umi.uploader.uploadJson({{
    name: "Lil Turtle",
    symbol: "LIL",
    description: "A cute lil turtle NFT",
    image: image,
    external_url: "https://lil-turtle.framer.website/",
    attributes: [
        { trait_type: "Turtle", value: "Lil Turtle" },
        { trait_type: "Size", value: "Little" },
        {trait_type: "Hairstyle", value: "Mohawk" }
    ],
});

const collectionMint = generateSigner(umi);

await createNft(umi,{
    mint: collectionMint,
    name "Lil Turtle Collection",
    uri: "https://lil-turtle.framer.website/",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
}).sendAndConfirm(umi);

const { signature, result } = await createNft(umi,{
    mint,
    name: "Lil Turtle",
    uri,
    updateAuthority: umi.identity.publicKey,
    sellerFreeBasisPoints: percentAmount(0),
    collection: {key: collectionMint.publicKey, verified: false}
}).sendAndConfirm(umi, {send :{commitment: "finalized"}});

const metadata = findMetadataPda(umi, {mint: mintArgs.publicKey});

await verifyCollectionV1(umi, {
    metadata,
    collectionMint,
    authority: umi.identity,
}).sendAndConfirm(umi);

console.log("NFT created with signature:", signature);