import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import { config as useConfig } from 'dotenv'
import 'hardhat-deploy' // add this line

useConfig()
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL as string

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: '0.8.18' },
      { version: '0.8.7' },
      {
        version: '0.6.6',
      },
      {
        version: '0.6.12',
      },
      {
        version: '0.4.19',
      },
    ],
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { chainId: 31337 },
    sepolia: { chainId: 11155111, url: SEPOLIA_RPC_URL, accounts: [PRIVATE_KEY] },
  },
  namedAccounts: { deployer: { default: 0, 1: 0 } },
  etherscan: { apiKey: ETHERSCAN_API_KEY },
}

export default config
