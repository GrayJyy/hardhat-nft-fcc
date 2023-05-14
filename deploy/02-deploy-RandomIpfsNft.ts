import { VERIFICATION_BLOCK_CONFIRMATIONS, developmentChains, networkConfig } from '../helper-hardhat-config'
import { ethers } from 'hardhat'
import verify from '../utils/verify'
import { storageImage, storeTokenUriMetadata } from '../utils/uploadToPinata'
import { DeployFunction } from 'hardhat-deploy/dist/types'
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

const deployRandomIpfsNft: DeployFunction = async hre => {
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
  let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock
  if (chainId === 31337) {
    const vrfCoordinatorV2MockRes = await deployments.get('VRFCoordinatorV2Mock')
    vrfCoordinatorV2Mock = await ethers.getContractAt('VRFCoordinatorV2Mock', vrfCoordinatorV2MockRes.address)
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

  /**
   * 为什么要调用addConsumer函数？
   * 在vrfCoordinatorV2Mock接口中，fulfillRandomWords函数用了onlyValidConsumer修饰器修饰：
   *   modifier onlyValidConsumer(uint64 _subId, address _consumer) {
    if (!consumerIsAdded(_subId, _consumer)) { // consumerIsAdded判断是否通过addConsumer函数添加了消费者，如果没有，抛出InvalidConsumer错误
      revert InvalidConsumer();
    }
    _;
  }
  因此，如果用到了vrfCoordinatorV2Mock合约，那么需要手动调用addConsumer(订阅id，消费者地址)，使得后续fulfillRandomWords函数可以正常调用
  如果没有这段代码，后续在本地环境测试时，总会抛出InvalidConsumer错误。
  至于为什么VRFCoordinatorV2合约不需要手动调用这个函数而vrfCoordinatorV2Mock需要，是因为前者的fulfillRandomWords没有用onlyValidConsumer修饰器修饰
  这段代码需要注意放在vrfCoordinatorV2Mock和randomIpfsNft都deploy以后
   */
  if (vrfCoordinatorV2Mock) {
    await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address)
  }
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
