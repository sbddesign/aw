import { useState, useEffect } from 'react'
import { SingleKey, Wallet, Ramps } from '@arkade-os/sdk'
import './App.css'

interface WalletData {
  privateKey: string
  address: string
  boardingAddress?: string
  balance?: {
    boarding?: {
      confirmed: number
      unconfirmed: number
      total: number
    }
    settled: number
    preconfirmed: number
    available: number
    recoverable: number
    total: number
  }
}

function App() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [sendAddress, setSendAddress] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  useEffect(() => {
    // Load wallet from localStorage on component mount
    const savedWallet = localStorage.getItem('arkWallet')
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet))
      } catch (error) {
        console.error('Error loading wallet from localStorage:', error)
        localStorage.removeItem('arkWallet')
      }
    }
  }, [])

  const createWallet = async () => {
    setIsCreating(true)
    try {
      // Generate a random private key
      const privateKey = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')

      // Create identity from private key
      const identity = SingleKey.fromHex(privateKey)

      // Create wallet instance
      const walletInstance = await Wallet.create({
        identity,
        arkServerUrl: 'https://mutinynet.arkade.sh',
      })

      // Get wallet address
      const address = await walletInstance.getAddress()

      // Get wallet balance
      const balance = await walletInstance.getBalance()

      // Get boarding address
      const boardingAddress = await walletInstance.getBoardingAddress()

      // Notify about incoming funds to detect any pending transactions
      await walletInstance.notifyIncomingFunds()

      // Get updated balance after notifying about incoming funds
      const updatedBalance = await walletInstance.getBalance()

      const walletData: WalletData = {
        privateKey,
        address,
        boardingAddress,
        balance: {
          total: updatedBalance.total,
          available: updatedBalance.available
        }
      }

      setWallet(walletData)
      localStorage.setItem('arkWallet', JSON.stringify(walletData))
    } catch (error) {
      console.error('Error creating wallet:', error)
      alert('Failed to create wallet. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const refreshBalance = async () => {
    if (!wallet) return
    
    try {
      // Recreate wallet instance from stored private key
      const identity = SingleKey.fromHex(wallet.privateKey)
      const walletInstance = await Wallet.create({
        identity,
        arkServerUrl: 'https://mutinynet.arkade.sh',
      })

      // Notify about incoming funds
      await walletInstance.notifyIncomingFunds()

      // Get updated balance
      const updatedBalance = await walletInstance.getBalance()

      // Update wallet data with new balance
      const updatedWalletData: WalletData = {
        ...wallet,
        balance: updatedBalance
      }

      setWallet(updatedWalletData)
      localStorage.setItem('arkWallet', JSON.stringify(updatedWalletData))
    } catch (error) {
      console.error('Error refreshing balance:', error)
      alert('Failed to refresh balance. Please try again.')
    }
  }

  const processBoardingFunds = async () => {
    if (!wallet) return
    
    try {
      // Recreate wallet instance from stored private key
      const identity = SingleKey.fromHex(wallet.privateKey)
      const walletInstance = await Wallet.create({
        identity,
        arkServerUrl: 'https://mutinynet.arkade.sh',
      })

      // Create Ramps instance to process boarding funds
      const ramps = new Ramps(walletInstance)
      
      // Onboard all available boarding UTXOs to off-chain VTXOs
      const commitmentTxid = await ramps.onboard()

      // Refresh balance after processing
      await refreshBalance()
      
      alert(`Boarding funds processed successfully! Commitment transaction ID: ${commitmentTxid}`)
    } catch (error) {
      console.error('Error processing boarding funds:', error)
      alert(`Failed to process boarding funds: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const sendPayment = async () => {
    if (!wallet || !sendAddress || !sendAmount) {
      alert('Please fill in both address and amount')
      return
    }

    const amount = parseInt(sendAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (wallet.balance && amount > wallet.balance.available) {
      alert('Insufficient balance')
      return
    }

    setIsSending(true)
    setSendResult(null)

    try {
      // Recreate wallet instance from stored private key
      const identity = SingleKey.fromHex(wallet.privateKey)
      const walletInstance = await Wallet.create({
        identity,
        arkServerUrl: 'https://mutinynet.arkade.sh',
      })

      // Send bitcoin using the ArkadeOS SDK
      const result = await walletInstance.sendBitcoin({
        to: sendAddress,
        amount: amount
      })

      setSendResult(`Payment sent successfully! Transaction ID: ${result.txid || 'N/A'}`)
      
      // Clear form
      setSendAddress('')
      setSendAmount('')

      // Refresh balance after sending
      await refreshBalance()
    } catch (error) {
      console.error('Error sending payment:', error)
      setSendResult(`Failed to send payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSending(false)
    }
  }

  const clearWallet = () => {
    setWallet(null)
    localStorage.removeItem('arkWallet')
    setSendAddress('')
    setSendAmount('')
    setSendResult(null)
  }

  return (
    <div style={{ 
      textAlign: 'center', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#ffffff'
    }}>
      <h1 style={{ 
        fontSize: '4rem', 
        fontWeight: 'bold', 
        marginBottom: '2rem',
        color: '#ffffff'
      }}>
        aw
      </h1>
      
      {wallet ? (
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          padding: '2rem',
          border: '1px solid #444',
          borderRadius: '8px',
          backgroundColor: '#2d2d2d'
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#ffffff' }}>Your Ark Wallet</h2>
          
          <div style={{ 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#3a3a3a',
            borderRadius: '4px',
            border: '1px solid #555'
          }}>
            <strong style={{ color: '#ffffff' }}>Address:</strong>
            <div style={{ 
              wordBreak: 'break-all', 
              fontSize: '0.9rem',
              marginTop: '0.5rem',
              color: '#cccccc'
            }}>
              {wallet.address}
            </div>
          </div>

          {wallet.boardingAddress && (
            <div style={{ 
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#3a3a3a',
              borderRadius: '4px',
              border: '1px solid #555'
            }}>
              <strong style={{ color: '#ffffff' }}>Boarding Address:</strong>
              <div style={{ 
                wordBreak: 'break-all', 
                fontSize: '0.9rem',
                marginTop: '0.5rem',
                color: '#cccccc'
              }}>
                {wallet.boardingAddress}
              </div>
            </div>
          )}

          {wallet.balance && (
            <div style={{ 
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#3a3a3a',
              borderRadius: '4px',
              border: '1px solid #555'
            }}>
              <strong style={{ color: '#ffffff' }}>Balance:</strong>
              <div style={{ marginTop: '0.5rem', color: '#cccccc' }}>
                <div>Total: {wallet.balance.total} sats</div>
                <div>Available: {wallet.balance.available} sats</div>
                {wallet.balance.boarding && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Boarding (On-chain):</div>
                    <div>Confirmed: {wallet.balance.boarding.confirmed} sats</div>
                    <div>Unconfirmed: {wallet.balance.boarding.unconfirmed} sats</div>
                    <div>Total: {wallet.balance.boarding.total} sats</div>
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
                  <div>Settled: {wallet.balance.settled} sats</div>
                  <div>Preconfirmed: {wallet.balance.preconfirmed} sats</div>
                  <div>Recoverable: {wallet.balance.recoverable} sats</div>
                </div>
              </div>
            </div>
          )}

          {/* Send Payment Form */}
          <div style={{ 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#3a3a3a',
            borderRadius: '4px',
            border: '1px solid #555'
          }}>
            <strong style={{ color: '#ffffff', marginBottom: '1rem', display: 'block' }}>Send Payment:</strong>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Enter Ark address"
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input
                type="number"
                placeholder="Amount in sats"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#2d2d2d',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              onClick={sendPayment}
              disabled={isSending || !sendAddress || !sendAmount}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: isSending || !sendAddress || !sendAmount ? '#666' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSending || !sendAddress || !sendAmount ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
            >
              {isSending ? 'Sending...' : 'Send Payment'}
            </button>

            {sendResult && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: sendResult.includes('successfully') ? '#28a745' : '#dc3545',
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.9rem',
                wordBreak: 'break-word'
              }}>
                {sendResult}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={refreshBalance}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Refresh Balance
            </button>
            {wallet.balance?.boarding && wallet.balance.boarding.total > 0 && (
              <button 
                onClick={processBoardingFunds}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ffc107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Process Boarding Funds
              </button>
            )}
            <button 
              onClick={clearWallet}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Clear Wallet
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={createWallet}
          disabled={isCreating}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: isCreating ? '#666' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isCreating ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isCreating ? 'Creating Wallet...' : 'Create Wallet'}
        </button>
      )}
    </div>
  )
}

export default App
