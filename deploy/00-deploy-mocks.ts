import { DECIMALS, INITIAL_PRICE } from '../helper-hardhat-config'
import { DeployFunction } from 'hardhat-deploy/dist/types'

const BASE_FEE = '250000000000000000' // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas
const deployMocks: DeployFunction = async hre => {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const chainId = network.config.chainId
  const { deployer } = await getNamedAccounts()
  if (chainId === 31337) {
    log('Local network detected! Deploying mocks...')
    await deploy('VRFCoordinatorV2Mock', {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    })
    await deploy('MockV3Aggregator', {
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_PRICE],
    })

    log('Mocks Deployed!')
    log('----------------------------------')
    log("You are deploying to a local network, you'll need a local network running to interact")
    log('Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!')
    log('----------------------------------')
  }
}
deployMocks.tags = ['all', 'mocks', 'main']
export default deployMocks
