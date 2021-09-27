import { useState, useEffect, MouseEvent } from 'react'
import type { NextPage } from 'next'
import { StdFee, Coin } from '@cosmjs/amino'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { SigningCosmWasmClient, CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import {
  convertMicroDenomToDenom,
  convertFromMicroDenom,
  convertDenomToMicroDenom,
} from 'util/conversion'

const PUBLIC_CHAIN_NAME = process.env.NEXT_PUBLIC_CHAIN_NAME
const PUBLIC_STAKING_DENOM = process.env.NEXT_PUBLIC_STAKING_DENOM || 'ujuno'

const Purchase: NextPage = () => {
  const { walletAddress, signingClient } = useSigningClient()
  const [balance, setBalance] = useState('')
  const [loadedAt, setLoadedAt] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [numToken, setNumToken] = useState(500)
  const [showNumToken, setShowNumToken] = useState(false)

  useEffect(() => {
    if (!signingClient || walletAddress.length === 0) return

    setError('')
    setSuccess('')

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
    // Calculate the number of token given the purchase amount divided by the price (using GetPrice)...
    if (!signingClient) return

    // NOTE: You don't need a signing client and therefore do not need a wallet connected before running smart contract queries
    signingClient.queryContractSmart(process.env.NEXT_PUBLIC_TOKEN_SALE_CONTRACT, {
      get_price: {},
    }).then((res) => {
      // 1 POOD token = 1000 uJUNO (micro)
      const price  = convertMicroDenomToDenom(res.price.amount)
      setNumToken(purchaseAmount/price)
    }).catch((error) => {
      console.log(error)
    })

    setShowNumToken(!!purchaseAmount)
  }, [purchaseAmount, signingClient])

  const handlePurchase = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
  }

  return (
    <WalletLoader loading={loading}>
      <p className="text-primary">Your wallet has {balance}</p>
      <h1 className="text-3xl mt-10 mb-9">
        Execute a token sale with {PUBLIC_CHAIN_NAME}
      </h1>
      <div className="form-control">
        <div className="relative">
          <input
            type="number"
            id="purchase-amount"
            placeholder="Amount"
            step="0.1"
            className="w-full pr-16 input input-lg input-primary input-bordered font-mono"
            onChange={(event) => setPurchaseAmount(event.target.value)}
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
          <h1 className="text-3xl mt-3 text-primary">{numToken} Token</h1>
        </div>
      )}

      <div className="mt-4 flex flex-col w-full max-w-xl">
        {success.length > 0 && (
          <div className="alert alert-success">
            <div className="flex-1 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="flex-shrink-0 w-6 h-6 mx-2 stroke-current flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                ></path>
              </svg>
              <label className="flex-grow break-all">{success}</label>
            </div>
          </div>
        )}
        {error.length > 0 && (
          <div className="alert alert-error">
            <div className="flex-1 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-6 h-6 mx-2 stroke-current flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                ></path>
              </svg>
              <label className="flex-grow break-all">{error}</label>
            </div>
          </div>
        )}
      </div>
    </WalletLoader>
  )
}

export default Purchase
