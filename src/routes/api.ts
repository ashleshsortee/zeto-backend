// @ts-nocheck

import { Router, Request, Response } from "express";
import { ethers, BigNumberish } from "ethers";
import { newUser, newUTXO, User, UTXO } from "../lib/utils";
import { loadCircuit, encodeProof } from "../lib/zkp/js";
import { readFileSync } from "fs";
import * as path from "path";
import { groth16 } from "snarkjs";
import { parseEther } from "viem";
import { formatPrivKeyForBabyJub, stringifyBigInts } from "maci-crypto";

const router = Router();
const ZERO_PUBKEY = [0, 0];

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

  console.log("inputObj", inputObj);

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
async function prepareProof(
  circuit: any,
  provingKey: any,
  signer: User,
  inputs: UTXO[],
  outputs: UTXO[],
  owners: User[]
) {
  const inputCommitments: [BigNumberish, BigNumberish] = inputs.map(
    (input) => input.hash
  ) as [BigNumberish, BigNumberish];
  const inputValues = inputs.map((input) => BigInt(input.value || 0n));
  const inputSalts = inputs.map((input) => input.salt || 0n);
  const outputCommitments: [BigNumberish, BigNumberish] = outputs.map(
    (output) => output.hash
  ) as [BigNumberish, BigNumberish];
  const outputValues = outputs.map((output) => BigInt(output.value || 0n));
  const outputSalts = outputs.map((o) => o.salt || 0n);
  const outputOwnerPublicKeys: [
    [BigNumberish, BigNumberish],
    [BigNumberish, BigNumberish]
  ] = owners.map((owner) => owner.babyJubPublicKey || ZERO_PUBKEY) as [
    [BigNumberish, BigNumberish],
    [BigNumberish, BigNumberish]
  ];
  const otherInputs = stringifyBigInts({
    inputOwnerPrivateKey: formatPrivKeyForBabyJub(signer.babyJubPrivateKey),
  });

  const startWitnessCalculation = Date.now();
  const witness = await circuit.calculateWTNSBin(
    {
      inputCommitments,
      inputValues,
      inputSalts,
      outputCommitments,
      outputValues,
      outputSalts,
      outputOwnerPublicKeys,
      ...otherInputs,
    },
    true
  );
  const timeWitnessCalculation = Date.now() - startWitnessCalculation;

  const startProofGeneration = Date.now();
  const { proof, publicSignals } = (await groth16.prove(
    provingKey,
    witness
  )) as { proof: BigNumberish[]; publicSignals: BigNumberish[] };
  const timeProofGeneration = Date.now() - startProofGeneration;
  console.log(
    `Witness calculation time: ${timeWitnessCalculation}ms, Proof generation time: ${timeProofGeneration}ms`
  );
  const encodedProof = encodeProof(proof);
  return {
    inputCommitments,
    outputCommitments,
    encodedProof,
  };
}
let sender = {
  signer: {
    provider: {},
    address: "0xD14Ea1ed35DcE48BE3375aA1162F2B2d6A33a465",
  },
  ethAddress: "0xD14Ea1ed35DcE48BE3375aA1162F2B2d6A33a465",
  babyJubPrivateKey:
    6324256280312473777967681696479815890870889009628290542929508861189431680681n,
  babyJubPublicKey: [
    12272621234975364082857678671838395038892879583462041976847058442189389028017n,
    280747620178470772301510133895636708710150648976680629139476716976969856109n,
  ],
  formattedPrivateKey:
    6796525494593858591117563813831186312580968701825023242962350832043485719797n,
};

// Example API route
router.post("/generate-proof", async (req: Request, res: Response) => {
  const provider = new ethers.JsonRpcProvider(
    "https://sepolia.infura.io/v3/a17f5301f00345d88ecae1cbd724e4af"
  );
  const privateKey =
    "0x39d4d54b595b40d36ff118b16cadba2e6accf001030cbc457d5c5ce86f74fd4d";
  const signer = new ethers.Wallet(privateKey, provider);

  if (!sender) {
    console.log("creating new sender...");
    sender = await newUser(signer);
  }

  console.log("console sender", sender);

  const utxo = newUTXO(req.body.amount, sender); // 10
  console.log("console utxo", utxo);

  const result = await prepareDepositProof(sender, utxo);

  const jsonString = JSON.stringify(result, (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

  console.log("console result", result);

  res.setHeader("Content-Type", "application/json");
  res.send(jsonString);
});

router.get("/transfer-proof", async (req: Request, res: Response) => {
  try {
    // sender's input UTXOs
    const provider = new ethers.JsonRpcProvider(
      "https://sepolia.infura.io/v3/a17f5301f00345d88ecae1cbd724e4af"
    );
    // const privateKey =
    //   "0x39d4d54b595b40d36ff118b16cadba2e6accf001030cbc457d5c5ce86f74fd4d";
    // const signer = new ethers.Wallet(privateKey, provider);
    // const sender = await newUser(signer);

    const utxo1 = {
      value: "10",
      hash: 3646291598752793754812933173898622836657192711694616877305564630588289935803n,
      salt: 20583737005007232339264018572951112929802360873831628502911119219849902591987n,
    };

    const utxo2 = {
      value: "20",
      hash: 10515388575941427783546410489884679101503369017269496788303891446055934952156n,
      salt: 4663863106882579818369667553312278345589314397324994849857636474205837176422n,
    };

    // proposed output UTXOs
    const recipientPvtKey =
      "0x956cc3175563cab38cf9402334ba198325b3f3eb16335b3f3a627fd3dfaa6306";
    const recipientSigner = new ethers.Wallet(recipientPvtKey, provider);
    const recipient = await newUser(recipientSigner);

    const _txo3 = newUTXO(20, recipient);
    const utxo4 = newUTXO(10, sender, _txo3.salt);

    const result = await doTransfer(
      sender,
      [utxo1, utxo2],
      [_txo3, utxo4],
      [recipient, sender]
    );
    console.log("console result", { ...result, recipient, sender });

    const jsonString = JSON.stringify(
      { ...result, owners: [recipient, sender] },
      (_, value) => (typeof value === "bigint" ? value.toString() : value)
    );

    console.log("console result", result);

    res.setHeader("Content-Type", "application/json");
    res.send(jsonString);
  } catch (err) {
    console.log("console err", err);
  }
});

router.get("/decode", async (req, res) => {
  const errorData =
    "0x839251272869565690ebe9e5b9d201fff955770e9d203c6d952e932d8c1660eeb2aa7998";
  const decoded = ethers.toUtf8String(errorData.slice(138));
  console.log("Revert reason:", decoded);

  res.send(decoded);
});

async function doTransfer(
  signer: User,
  inputs: UTXO[],
  outputs: UTXO[],
  owners: User[]
) {
  let inputCommitments: [BigNumberish, BigNumberish];
  let outputCommitments: [BigNumberish, BigNumberish];
  let outputOwnerAddresses: [AddressLike, AddressLike];
  let encodedProof: any;

  const circuit = await loadCircuit("anon");
  const { provingKeyFile: provingKey } = loadProvingKeys("anon");

  const result = await prepareProof(
    circuit,
    provingKey,
    signer,
    inputs,
    outputs,
    owners
  );
  console.log("console result1111", result);
  inputCommitments = result.inputCommitments;
  outputCommitments = result.outputCommitments;
  outputOwnerAddresses = owners.map(
    (owner) => owner.ethAddress || ZeroAddress
  ) as [AddressLike, AddressLike];
  encodedProof = result.encodedProof;

  console.log("console encodedProof", result);

  return result;
}

export default router;
