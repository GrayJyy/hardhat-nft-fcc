import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { VERIFICATION_BLOCK_CONFIRMATIONS, developmentChains, networkConfig } from '../helper-hardhat-config'
import { ethers } from 'hardhat'
import verify from '../utils/verify'

const FUND_AMOUNT = '1000000000000000000000'

const deployRandomIpfsNft = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const waitConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS
  const chainId = network.config.chainId as number
  const currentConfig = networkConfig[chainId]
  let vrfCoordinatorV2Address, subscriptionId
  if (chainId === 31337) {
    const vrfCoordinatorV2MockRes = await deployments.get('VRFCoordinatorV2Mock')
    const vrfCoordinatorV2Mock = await ethers.getContractAt('VRFCoordinatorV2Mock', vrfCoordinatorV2MockRes.address)
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
    const transactionReceipt = await transactionResponse.wait()
    subscriptionId = transactionReceipt.events![0].args!.subId

    // Fund the subscription
    // Our mock makes it so we don't actually have to worry about sending fund
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
  } else {
    vrfCoordinatorV2Address = currentConfig.vrfCoordinatorV2
    subscriptionId = currentConfig.subscriptionId
  }

  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    currentConfig.subscriptionId,
    currentConfig.gasLane,
    currentConfig.callbackGasLimit,
    '', // nft信息
    currentConfig.mintFee,
  ]
  const randomIpfsNft = await deploy('RandomIpfsNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations,
  })
  // Verify
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying......')
    await verify(randomIpfsNft.address, args)
  }
}
deployRandomIpfsNft.tags = ['all', 'randomipfsnft', 'main']
export default deployRandomIpfsNft
