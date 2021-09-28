import type { NextPage } from 'next'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useEffect, useState, MouseEvent, ChangeEvent } from 'react'
import {
  convertMicroDenomToDenom, 
  convertDenomToMicroDenom,
  convertFromMicroDenom
} from 'util/conversion'
import { coin } from '@cosmjs/launchpad'
import { useAlert } from 'react-alert'

const PUBLIC_STAKING_DENOM = process.env.NEXT_PUBLIC_STAKING_DENOM || 'ujuno'
const PUBLIC_TOKEN_SALE_CONTRACT = process.env.NEXT_PUBLIC_TOKEN_SALE_CONTRACT || ''
const PUBLIC_CW20_CONTRACT = process.env.NEXT_PUBLIC_CW20_CONTRACT || ''

const Home: NextPage = () => {
  const { walletAddress, signingClient, connectWallet } = useSigningClient()
  const [balance, setBalance] = useState('')
  const [walletAmount, setWalletAmount] = useState(0)
  const [loadedAt, setLoadedAt] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState({ name: '', symbol: '' })
  const [purchaseAmount, setPurchaseAmount] = useState<any>('')
  const [numToken, setNumToken] = useState(0)
  const [showNumToken, setShowNumToken] = useState(false)
  const alert = useAlert()

  useEffect(() => {
    if (!signingClient || walletAddress.length === 0) return

    // Gets native balance (i.e. Juno balance)
    signingClient.getBalance(walletAddress, PUBLIC_STAKING_DENOM).then((response: any) => {
      const { amount, denom }: { amount: number; denom: string } = response
      setBalance(`${convertMicroDenomToDenom(amount)} ${convertFromMicroDenom(denom)}`)
      setWalletAmount(convertMicroDenomToDenom(amount))
    }).catch((error) => {
      alert.error(`Error! ${error.message}`)
      console.log('Error signingClient.getBalance(): ', error)
    })
  }, [signingClient, walletAddress, loadedAt, alert])

  useEffect(() => {
    if (!signingClient) return

    // Gets token information
    signingClient.queryContractSmart(PUBLIC_CW20_CONTRACT, {
      token_info: {},
    }).then((response) => {
      setTokenInfo(response)
    }).catch((error) => {
      alert.error(`Error! ${error.message}`)
      console.log('Error signingClient.queryContractSmart() token_info: ', error)
    })
  }, [signingClient, alert])

  /**
   * Calculates and sets the number of tokens given the purchase amount divided by the price
   */
   useEffect(() => {
    if (!signingClient) return

    signingClient.queryContractSmart(PUBLIC_TOKEN_SALE_CONTRACT, {
      get_price: {},
    }).then((response) => {
      const price  = convertMicroDenomToDenom(response.price.amount) // i.e. 1 POOD token = 1000 uJUNO (micro)
      setNumToken(purchaseAmount/price)
    }).catch((error) => {
      alert.error(`Error! ${error.message}`)
      console.log('Error signingClient.queryContractSmart() get_price: ', error)
    })

    setShowNumToken(!!purchaseAmount)
  }, [purchaseAmount, signingClient, alert])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { target: { value } } = event
    setPurchaseAmount(value)
  }

  const handlePurchase = (event: MouseEvent<HTMLElement>) => {
    if (!signingClient || walletAddress.length === 0) return
    if (!purchaseAmount) {
      alert.error('Please enter the amount you would like to purchase')
      return
    }
    if (purchaseAmount > walletAmount) {
      alert.error(`You do not have enough tokens to make this purchase, maximum you can spend is ${walletAmount}`)
      return
    }

    event.preventDefault()
    setLoading(true)

    signingClient?.execute(
      walletAddress, // sender address
      PUBLIC_TOKEN_SALE_CONTRACT, // token sale contract
      { buy: {} }, // msg
      undefined,
      [coin(parseInt(convertDenomToMicroDenom(purchaseAmount), 10), 'ujuno')]
    ).then((response) => {
      setLoadedAt(new Date())
      setLoading(false)
      alert.success('Successfully purchased!')
    }).catch((error) => {
      setLoading(false)
      alert.error(`Error! ${error.message}`)
      console.log('Error signingClient?.execute(): ', error)
    })
  }

  return (
    <WalletLoader loading={loading}>
      <p className="text-primary">Your wallet has {balance}</p>

      <h1 className="text-5xl mt-10 mb-12">
        Buy {tokenInfo.name}
      </h1>

      <div className="form-control">
        <div className="relative">
          <input
            type="number"
            id="purchase-amount"
            placeholder="Amount"
            step="0.1"
            className="w-full pr-16 input input-lg input-primary input-bordered font-mono"
            onChange={handleChange}
            value={purchaseAmount}
          /> 
          <button
            className="absolute top-0 right-0 rounded-l-none btn btn-lg btn-primary"
            onClick={handlePurchase}
          >
            purchase
          </button>
        </div>
      </div>

      {showNumToken && (
        <div className="mt-8">
          You are getting
          <h1 className="text-3xl mt-3 text-primary">
            {numToken} {tokenInfo.symbol}
          </h1>
        </div>
      )}
    </WalletLoader>
  )
}

export default Home
