import { useState, useEffect } from 'react'
import { SingleKey, Wallet } from '@arkade-os/sdk'
import './App.css'

interface WalletData {
  privateKey: string
  address: string
  balance?: {
    total: number
    available: number
  }
}

function App() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [isCreating, setIsCreating] = useState(false)

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

      const walletData: WalletData = {
        privateKey,
        address,
        balance: {
          total: balance.total,
          available: balance.available
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

  const clearWallet = () => {
    setWallet(null)
    localStorage.removeItem('arkWallet')
  }

  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: '20vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '4rem', 
        fontWeight: 'bold', 
        marginBottom: '2rem',
        color: '#333'
      }}>
        aw
      </h1>
      
      {wallet ? (
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          padding: '2rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#333' }}>Your Ark Wallet</h2>
          
          <div style={{ 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#fff',
            borderRadius: '4px',
            border: '1px solid #eee'
          }}>
            <strong>Address:</strong>
            <div style={{ 
              wordBreak: 'break-all', 
              fontSize: '0.9rem',
              marginTop: '0.5rem',
              color: '#666'
            }}>
              {wallet.address}
            </div>
          </div>

          {wallet.balance && (
            <div style={{ 
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#fff',
              borderRadius: '4px',
              border: '1px solid #eee'
            }}>
              <strong>Balance:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                <div>Total: {wallet.balance.total} sats</div>
                <div>Available: {wallet.balance.available} sats</div>
              </div>
            </div>
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
      ) : (
        <button 
          onClick={createWallet}
          disabled={isCreating}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: isCreating ? '#ccc' : '#007bff',
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
