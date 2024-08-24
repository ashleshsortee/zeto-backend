// @ts-nocheck
import { Router, Request, Response } from "express";
import { ethers, BigNumberish } from "ethers";
import { newUser, newUTXO, User, UTXO } from "../lib/utils";
import { loadCircuit, encodeProof } from "../lib/zkp/js";
import { readFileSync } from "fs";
import * as path from "path";
import { groth16 } from "snarkjs";
import { parseEther } from "viem";

const router = Router();

type Data = {
  message: string;
  txHash?: string;
  error?: string;
};

function provingKeysRoot() {
  const PROVING_KEYS_ROOT = process.env.PROVING_KEYS_ROOT;
  if (!PROVING_KEYS_ROOT) {
    throw new Error("PROVING_KEYS_ROOT env var is not set");
  }
  return PROVING_KEYS_ROOT;
}

export function loadProvingKeys(type: string) {
  const provingKeyFile = path.join(
    process.cwd(),
    "public",
    "proving-keys",
    `${type}.zkey`
  );
  const verificationKey = JSON.parse(
    new TextDecoder().decode(
      readFileSync(
        path.join(process.cwd(), "public", "proving-keys", `${type}-vkey.json`)
      )
    )
  );
  return {
    provingKeyFile,
    verificationKey,
  };
}

async function prepareDepositProof(signer: User, output: UTXO) {
  const outputCommitments: [BigNumberish] = [output.hash] as [BigNumberish];
  const outputValues = [BigInt(output.value || 0n)];
  const outputOwnerPublicKeys: [[BigNumberish, BigNumberish]] = [
    signer.babyJubPublicKey,
  ] as [[BigNumberish, BigNumberish]];

  const inputObj = {
    outputCommitments,
    outputValues,
    outputSalts: [output.salt],
    outputOwnerPublicKeys,
  };

  const circuit = await loadCircuit("check_hashes_value");
  const { provingKeyFile } = loadProvingKeys("check_hashes_value");

  const startWitnessCalculation = Date.now();
  const witness = await circuit.calculateWTNSBin(inputObj, true);
  const timeWithnessCalculation = Date.now() - startWitnessCalculation;

  const startProofGeneration = Date.now();
  const { proof, publicSignals } = (await groth16.prove(
    provingKeyFile,
    witness
  )) as { proof: BigNumberish[]; publicSignals: BigNumberish[] };
  const timeProofGeneration = Date.now() - startProofGeneration;

  console.log(
    `Witness calculation time: ${timeWithnessCalculation}ms. Proof generation time: ${timeProofGeneration}ms.`
  );

  const encodedProof = encodeProof(proof);
  return {
    outputCommitments,
    encodedProof,
  };
}

// Example API route
router.post("/generate-proof", async (req: Request, res: Response) => {
  const provider = new ethers.JsonRpcProvider(
    "https://sepolia.infura.io/v3/a17f5301f00345d88ecae1cbd724e4af"
  );
  const privateKey = "<replace>";
  const signer = new ethers.Wallet(privateKey, provider);
  const sender = await newUser(signer);
  const utxo = newUTXO(req.body.amount * (10 ^ 18), sender);

  const result = await prepareDepositProof(sender, utxo);

  const jsonString = JSON.stringify(result, (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

  console.log("console result", result);

  res.setHeader("Content-Type", "application/json");
  res.send(jsonString);
});

router.post("/transfer-proof", async (req: Request, res: Response) => {
  // sender's input UTXOs
  const sender = await newUser(signer);

  const utxo1 = newUTXO(10, sender);
  const utxo2 = newUTXO(20, sender);

  // proposed output UTXOs
  const recipientPvtKey = "<replace>";
  const recipientSigner = new ethers.Wallet(recipientPvtKey, provider);
  const recipient = await newUser(recipientSigner);
  const _txo3 = newUTXO(25, recipient);
  const utxo4 = newUTXO(5, sender, _txo3.salt);
});

export default router;
