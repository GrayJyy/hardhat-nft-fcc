import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const mint: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, network, ethers, deployments } = hre
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  // Basic NFT
  const { address: BasicNftAddress } = await deployments.get('BasicNft')
  const basicNft = await ethers.getContractAt('BasicNft', BasicNftAddress)
  const basicMintTx = await basicNft.mintNft()

  await basicMintTx.wait(1)
  console.log(`Basic NFT index 0 tokenURI: ${await basicNft.tokenURI(0)}`)

  // Dynamic SVG  NFT
  const highValue = ethers.utils.parseEther('4000')
  const { address: DynamicSvgNftAddress } = await deployments.get('DynamicSvgNft')
  const dynamicSvgNft = await ethers.getContractAt('DynamicSvgNft', DynamicSvgNftAddress)
  const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue)
  await dynamicSvgNftMintTx.wait(1)
  console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)

  // Random IPFS NFT
  const { address: RandomIpfsNftAddress } = await deployments.get('RandomIpfsNft')
  const randomIpfsNft = await ethers.getContractAt('RandomIpfsNft', RandomIpfsNftAddress)
  const mintFee = await randomIpfsNft.mintFee()
  const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
  const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)
  // Need to listen for response
  await new Promise<void>(async resolve => {
    // setup listener for our event
    randomIpfsNft.once('NftMinted', async () => {
      resolve()
    })
    if (chainId == 31337) {
      const requestId = randomIpfsNftMintTxReceipt.events![1].args!.requestId.toString()
      const { address: VRFCoordinatorV2MockAddress } = await deployments.get('VRFCoordinatorV2Mock')
      const vrfCoordinatorV2Mock = await ethers.getContractAt('VRFCoordinatorV2Mock', VRFCoordinatorV2MockAddress)
      await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
    }
  })
  console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`)
}
export default mint
mint.tags = ['all', 'mint']
