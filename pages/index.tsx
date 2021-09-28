import type { NextPage } from 'next'
import Link from 'next/link'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useEffect, useState } from 'react'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import {
  convertMicroDenomToDenom, 
  convertDenomToMicroDenom,
  convertFromMicroDenom
} from 'util/conversion'
import { coin } from '@cosmjs/launchpad'

const PUBLIC_STAKING_DENOM = process.env.NEXT_PUBLIC_STAKING_DENOM || 'ujuno'
const PUBLIC_TOKEN_SALE_CONTRACT = process.env.NEXT_PUBLIC_TOKEN_SALE_CONTRACT
const PUBLIC_CW20_CONTRACT = process.env.NEXT_PUBLIC_CW20_CONTRACT

const Home: NextPage = () => {
  const { walletAddress, signingClient, connectWallet } = useSigningClient()
  const [balance, setBalance] = useState('')
  const [loadedAt, setLoadedAt] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [tokenInfo, setTokenInfo] = useState(null)
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [numToken, setNumToken] = useState(500)
  const [showNumToken, setShowNumToken] = useState(false)

  useEffect(() => {
    if (!signingClient || walletAddress.length === 0) return

    setError('')
    setSuccess('')

    // Gets native balance (i.e. Juno balance)
    signingClient.getBalance(walletAddress, PUBLIC_STAKING_DENOM).then((response: any) => {
      const { amount, denom }: { amount: number; denom: string } = response
      setBalance(
        `${convertMicroDenomToDenom(amount)} ${convertFromMicroDenom(denom)}`
      )
    }).catch((error) => {
      setError(`Error! ${error.message}`)
      console.log('Error signingClient.getBalance(): ', error)
    })
  }, [signingClient, walletAddress, loadedAt])

  useEffect(() => {
    if (!signingClient) return

    // Gets token information
    signingClient.queryContractSmart(PUBLIC_CW20_CONTRACT, {
      token_info: {},
    }).then((response) => {
      setTokenInfo(response)
    }).catch((error) => {
      setError(`Error! ${error.message}`)
      console.log('Error signingClient.queryContractSmart() token_info: ', error)
    })
  }, [signingClient])

  /**
   * Calculates and sets the number of tokens given the purchase amount divided by the price
   */
   useEffect(() => {
    if (!signingClient) return

    signingClient.queryContractSmart(PUBLIC_TOKEN_SALE_CONTRACT, {
      get_price: {},
    }).then((response) => {
      // i.e. 1 POOD token = 1000 uJUNO (micro)
      const price  = convertMicroDenomToDenom(response.price.amount)
      setNumToken(purchaseAmount/price)
    }).catch((error) => {
      setError(`Error! ${error.message}`)
      console.log('Error signingClient.queryContractSmart() get_price: ', error)
    })

    setShowNumToken(!!purchaseAmount)
  }, [purchaseAmount, signingClient])

  const handleChange = (e) => setPurchaseAmount(e.target.value)

  const handlePurchase = (event: MouseEvent<HTMLElement>) => {
    if (!signingClient || walletAddress.length === 0) return

    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    signingClient?.execute(
      walletAddress, // sender address
      PUBLIC_TOKEN_SALE_CONTRACT, // token sale contract
      { buy: {} }, // msg
      undefined,
      [coin(parseInt(convertDenomToMicroDenom(purchaseAmount), 10), 'ujuno')]
    ).then((response) => {
      console.log('signingClient?.execute() response = ', response)

      // TODO: Success toast message
    }).catch((error) => {
      setError(`Error! ${error.message}`)
      console.log('Error signingClient?.execute(): ', error)
    })
  }

  return (
    <WalletLoader>
      {tokenInfo && (
        <>
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
            <div className="mt-9">
              You are getting
              <h1 className="text-3xl mt-3 text-primary">
                {numToken} {tokenInfo.symbol}
              </h1>
            </div>
          )}
        </>
      )}
    </WalletLoader>
  )
}

export default Home
