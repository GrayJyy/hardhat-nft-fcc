import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { VERIFICATION_BLOCK_CONFIRMATIONS, developmentChains, networkConfig } from '../helper-hardhat-config'
import { ethers } from 'hardhat'
import verify from '../utils/verify'
import { storageImage, storeTokenUriMetadata } from '../utils/uploadToPinata'

export type metadataTemplate = {
  name: string
  description: string
  image: string
  attributes?: [
    {
      trait_type: string
      value: number
    }
  ]
}
const FUND_AMOUNT = '1000000000000000000000'
const IMAGES_PATH = './images/randomNft'

const deployRandomIpfsNft = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const waitConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS
  const chainId = network.config.chainId as number
  let tokenUris
  const currentConfig = networkConfig[chainId]
  if (process.env.UPLOAD_TO_PINATA) {
    tokenUris = await handleTokenUris()
  }
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
    currentConfig.gasLane,
    currentConfig.callbackGasLimit,
    tokenUris, // nft信息
    currentConfig.mintFee,
  ]

  /**
   *  关于deploy过程中出现的invalid BigNumber value报错问题：
   * 1.很小概率是args中的某个值大小超出合约中uint范围
   * 2.大概率是args中的某个值为undefined，在这里通过打印args定位问题 (因为我修改前问题就出在部署本地环境的时候gasLane和mintFee为undefined)
   * console.log(args)
   */

  const randomIpfsNft = await deploy('RandomIpfsNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations,
  })
  log('----------------------------------')
  log(`RandomIpfsNft Deployed at address ${randomIpfsNft.address}`)
  log('----------------------------------')
  //   Verify
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying......')
    await verify(randomIpfsNft.address, args)
  }
}

const handleTokenUris = async () => {
  const tokenUris: string[] = []
  const { res, files } = await storageImage(IMAGES_PATH)
  for (const index in res) {
    const nftInfo: metadataTemplate = {
      name: files[index],
      description: 'my dog',
      image: `ipfs://${res[index].IpfsHash}`,
    }
    const metadataInfo = await storeTokenUriMetadata(nftInfo)
    tokenUris.push(`ipfs://${metadataInfo?.IpfsHash}`)
    console.log(`tokenUris about  ${nftInfo.name} is uploaded!`)
  }
  console.log('handleTokenUris success!')

  return tokenUris
}
deployRandomIpfsNft.tags = ['all', 'randomipfsnft', 'main']
export default deployRandomIpfsNft
