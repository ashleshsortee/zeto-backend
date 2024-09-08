# Zeto Backend Server

This project is an Express-based API server that provides various endpoints for handling data operations. It includes endpoints to generate the proof for the zk-ecdsa signature scheme and also to verify it. It uses maci sdk for the zk-ecdsa signature scheme.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Installation

Install dependencies:

```
npm install
```

## Usage

To start the server, run:

```
npm run dev
```

## API Endpoints

### Generate Proof

To generate a proof, send a POST request to the `/api/generate-proof` endpoint with the following JSON body:

```
{
  "address": "0x1234567890123456789012345678901234567890",
  "amount": 10
}
```

### Verify Proof

To verify a proof, send a POST request to the `/api/verify-proof` endpoint with the following JSON body:

```
{
  "inputCommitments": ["0x1234567890123456789012345678901234567890"],
  "outputCommitments": ["0x1234567890123456789012345678901234567890"],
  "encodedProof": "0x1234567890123456789012345678901234567890"
}
```

## Configuration

The server can be configured using environment variables. Create a `.env` file in the root directory and set the following variables:

```
PORT=3001
MaciSdkContractAddress=0x1234567890123456789012345678901234567890
```

## Contributing

We welcome contributions to this project. Please read our [contributing guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

