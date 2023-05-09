import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import { config as useConfig } from 'dotenv'
import 'hardhat-deploy' // add this line
import { ProxyAgent, setGlobalDispatcher } from 'undici'

useConfig()
// 通过Clash的Allow LAN实现局域网翻墙 解决非本地网络合约Verify超时的网络问题 开启Clash局域网代理+安装undici两个条件缺一不可，这段代码才能正常运行
const proxyAgent = new ProxyAgent('http://127.0.0.1:7890')
setGlobalDispatcher(proxyAgent)
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY as string
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
// const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL as string

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: '0.8.18' },
      { version: '0.8.7' },
      { version: '0.8.0' },
      {
        version: '0.6.6',
      },
      { version: '0.6.0' },
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
  gasReporter: { enabled: false },
  mocha: { timeout: 500000 },
}

export default config
