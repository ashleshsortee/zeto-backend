// @ts-nocheck
import { Signer } from "ethers";
import { genKeypair, formatPrivKeyForBabyJub } from "maci-crypto";
import { Poseidon, newSalt } from "./zkp/js";

export interface User {
  signer: Signer;
  ethAddress: string;
  babyJubPrivateKey: BigInt;
  babyJubPublicKey: BigInt[];
  formattedPrivateKey: BigInt;
}

export interface UTXO {
  value?: number;
  tokenId?: number;
  uri?: string;
  hash: BigInt;
  salt?: BigInt;
}

const poseidonHash3 = Poseidon.poseidon3;
const poseidonHash4 = Poseidon.poseidon4;
const poseidonHash5 = Poseidon.poseidon5;

export interface UTXO {
  value?: number;
  tokenId?: number;
  uri?: string;
  hash: BigInt;
  salt?: BigInt;
}

export const ZERO_UTXO: UTXO = { hash: BigInt(0) };

export interface User {
  signer: Signer;
  ethAddress: string;
  babyJubPrivateKey: BigInt;
  babyJubPublicKey: BigInt[];
  formattedPrivateKey: BigInt;
}

export async function newUser(signer: Signer) {
  const { privKey, pubKey } = genKeypair();
  const formattedPrivateKey = formatPrivKeyForBabyJub(privKey);

  return {
    signer,
    ethAddress: await signer.getAddress(),
    babyJubPrivateKey: privKey,
    babyJubPublicKey: pubKey,
    formattedPrivateKey,
  };
}

export function newUTXO(value: number, owner: User, salt?: BigInt): UTXO {
  if (!salt) salt = newSalt();
  const hash = poseidonHash4([
    BigInt(value),
    salt,
    owner.babyJubPublicKey[0],
    owner.babyJubPublicKey[1],
  ]);
  return { value, hash, salt };
}
