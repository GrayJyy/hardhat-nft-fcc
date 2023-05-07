import { network, deployments, ethers } from 'hardhat'
import { BasicNft } from '../typechain-types'
import { expect, assert } from 'chai'
import { developmentChains } from '../helper-hardhat-config'

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('basicNft', () => {
      let basicNft: BasicNft
      beforeEach(async () => {
        const { BasicNft } = await deployments.fixture(['basicnft'])
        const basicNftAddress = BasicNft.address
        basicNft = await ethers.getContractAt('BasicNft', basicNftAddress)
      })
      it('Should mint a new NFT with counter increment', async () => {
        const counter = await basicNft.tokenCounter()
        expect(counter.toString()).to.equal('0')
        const tx = await basicNft.mintNft()
        await tx.wait()
        const counter2 = await basicNft.tokenCounter()
        expect(counter2.toString()).to.equal('1')
        const tokenUrl = await basicNft.tokenURI(0)
        assert.equal(tokenUrl, await basicNft.TOKEN_URL())
      })
    })
