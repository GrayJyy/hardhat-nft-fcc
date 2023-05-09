import { deployments, ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { RandomIpfsNft, VRFCoordinatorV2Mock } from '../../typechain-types'
import { assert, expect } from 'chai'

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('RandomIpfsNft', () => {
      let randomIpfsNft: RandomIpfsNft
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
      beforeEach(async () => {
        const { RandomIpfsNft, VRFCoordinatorV2Mock } = await deployments.fixture(['randomipfsnft', 'mocks'])
        const RandomIpfsNftAddress = RandomIpfsNft.address
        const VRFCoordinatorV2MockAddress = VRFCoordinatorV2Mock.address
        randomIpfsNft = await ethers.getContractAt('RandomIpfsNft', RandomIpfsNftAddress)
        vrfCoordinatorV2Mock = await ethers.getContractAt('VRFCoordinatorV2Mock', VRFCoordinatorV2MockAddress)
      })
      describe('constructor', () => {
        it('Should gets the dogTokenUris which each item include ipfs://', async () => {
          for (let index = 0; index < 3; index++) {
            const itemAtZero = await randomIpfsNft.dogTokenUris(index)
            assert(itemAtZero.includes('ipfs://'))
          }
        })
      })
      describe('requestNft', () => {
        it('Should fails if do not send enough eth', async () => {
          await expect(randomIpfsNft.requestNft()).to.be.revertedWithCustomError(
            randomIpfsNft,
            'RandomIpfsNft__NeedEnoughEth'
          )
        })
        it('Should emits an event and kicks off a random word request', async function () {
          const fee = await randomIpfsNft.mintFee()
          await expect(randomIpfsNft.requestNft({ value: fee })).to.emit(randomIpfsNft, 'NftRequested')
        })
      })
      describe('fulfillRandomWords', () => {
        it('Should mints NFT after random number returned', async () => {
          await new Promise<void>(async (resolve, reject) => {
            randomIpfsNft.once('NftMinted', async () => {
              try {
                const uri = await randomIpfsNft.tokenURI(0)
                const counter = await randomIpfsNft.counter()
                assert.equal(uri.includes('ipfs://'), true)
                assert.equal(counter.toString(), '1')
                resolve()
              } catch (error) {
                console.error(error)
                reject(error)
              }
            })
            try {
              const fee = await randomIpfsNft.mintFee()
              const tx = await randomIpfsNft.requestNft({ value: fee })
              const txReceipt = await tx.wait(1)
              /**
               * requestNft函数运行期间所有触发的事件都在txReceipt.events数组中
               *NftMinted是第二个事件，所以通过索引1获取
               */

              const requestId = txReceipt.events![1].args!.requestId
              console.log('start fulfillRandomWords...')
              await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
              console.log('fulfillRandomWords done!')
            } catch (error) {
              console.error(error)
            }
          })
        })
      })
    })
