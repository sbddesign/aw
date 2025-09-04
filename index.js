import { SingleKey, Wallet } from '@arkade-os/sdk'
import crypto from 'crypto'

// Generate a random private key for testing
const privateKey = crypto.randomBytes(32).toString('hex')
console.log('Generated private key:', privateKey)

// use your private key in hex format  
const identity = SingleKey.fromHex(privateKey)

// create a wallet instance
const wallet = await Wallet.create({
  identity,
  arkServerUrl: 'https://mutinynet.arkade.sh',
})

// You can receive bitcoin offchain instantly! No inbound liquidity!
const address = await wallet.getAddress()
console.log('Ark Address:', address)

const balance = await wallet.getBalance()
// total is spendable in settlement
console.log('Total :', balance.total)
// available is spendable in offchain transactions
console.log('Available :', balance.available)