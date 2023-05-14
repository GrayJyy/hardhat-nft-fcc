import { VERIFICATION_BLOCK_CONFIRMATIONS, developmentChains, networkConfig } from '../helper-hardhat-config'
import verify from '../utils/verify'
import fs from 'fs'
import { DeployFunction } from 'hardhat-deploy/dist/types'

const deployDynamicSvgNft: DeployFunction = async hre => {
  const { getNamedAccounts, network, deployments } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const waitConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS
  const chainId = network.config.chainId!
  let ethUsdPriceFeedAddress: string
  if (chainId === 31337) {
    const EthUsdAggregator = await deployments.get('MockV3Aggregator')
    ethUsdPriceFeedAddress = EthUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed as string
  }
  const lowSvg = fs.readFileSync('./images/dynamicNft/frown.svg', { encoding: 'utf8' })
  const highSvg = fs.readFileSync('./images/dynamicNft/happy.svg', { encoding: 'utf8' })
  log('----------------------------------------------------')
  const args: string[] = [ethUsdPriceFeedAddress, lowSvg, highSvg]
  const dynamicSvgNft = await deploy('DynamicSvgNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations,
  })
  if (!developmentChains.includes(network.name)) {
    log('verifying......')
    await verify(dynamicSvgNft.address, args)
  }
}

deployDynamicSvgNft.tags = ['all', 'main', 'dynamicsvgnft']
export default deployDynamicSvgNft
