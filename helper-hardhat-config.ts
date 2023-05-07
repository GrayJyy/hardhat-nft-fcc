export interface networkConfigItem {
  name?: string
  subscriptionId?: string
  keepersUpdateInterval?: string
  raffleEntranceFee?: string
  callbackGasLimit?: string
  vrfCoordinatorV2?: string
  gasLane?: string
  ethUsdPriceFeed?: string
  mintFee?: string
}

export type networkConfigInfo = { [key: number]: networkConfigItem }
const networkConfig = {
  31337: {
    name: 'localhost',
  },
  11155111: {
    name: 'sepolia',
  },
}

const developmentChains = ['localhost', 'hardhat']
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

export { networkConfig, developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS }
