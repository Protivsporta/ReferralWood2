import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";

dotenv.config();

const { RINKEBY_API_URL, ROPSTEN_API_URL, BSC_API_URL, PRIVATE_KEY, BSCSCAN_API } = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.13",
  networks: {
    ropsten: {
      url: ROPSTEN_API_URL,
      accounts: [PRIVATE_KEY!]
    },
    rinkeby: {
      url: RINKEBY_API_URL,
      accounts: [PRIVATE_KEY!]
    },
    bsc: {
      url: BSC_API_URL,
      accounts: [PRIVATE_KEY!]
    }
  },
  etherscan: {
    apiKey: BSCSCAN_API,
  }
};

export default config;
