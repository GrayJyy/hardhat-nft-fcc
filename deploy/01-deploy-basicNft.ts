import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { VERIFICATION_BLOCK_CONFIRMATIONS, developmentChains } from '../helper-hardhat-config'
import verify from '../utils/verify'

const deployBasicNft = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const waitConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS
  const args: any[] = []
  const basicNft = await deploy('BasicNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations,
  })
  // verify the development
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('verifying......')
    await verify(basicNft.address, args)
  }
}
deployBasicNft.tags = ['all', 'basicnft', 'main']
export default deployBasicNft