import pinataSDK, { PinataPinResponse } from '@pinata/sdk'
import fs from 'fs'
import path from 'path'
import { config } from 'dotenv'
import { metadataTemplate } from '../deploy/02-deploy-RandomIpfsNft'

config()
const PINATA_API_KEY = process.env.PINATA_API_KEY
const PINATA_API_SECRET = process.env.PINATA_API_SECRET
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET)
const storageImage = async (imgPath: string) => {
  const fullPath = path.resolve(imgPath)
  const files = fs.readdirSync(fullPath)
  console.log(files)
  let res: PinataPinResponse[] = []
  console.log('Uploading start...')

  for (const file of files) {
    const options = {
      pinataMetadata: {
        name: file,
      },
    }
    console.log(`Uploading ${file}...`)
    const readableStreamForFile = fs.createReadStream(`${fullPath}/${file}`)
    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile, options)
      res.push(response)
    } catch (error) {
      console.log(error)
    }
  }
  console.log('Done!')

  return { res, files }
}
const storeTokenUriMetadata = async (metadata: metadataTemplate) => {
  try {
    const res = await pinata.pinJSONToIPFS(metadata)
    return res
  } catch (error) {
    console.error(error)
  }
}
export { storageImage, storeTokenUriMetadata }
