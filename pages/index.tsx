import type { NextPage } from 'next'
import Link from 'next/link'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useEffect } from 'react'
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'

const Home: NextPage = () => {
  const { walletAddress, signingClient } = useSigningClient()

  useEffect(() => {
    if (!signingClient) return

    signingClient.queryContractSmart('juno1u52cx2m6lwqdw42eq3c03mqv6xxun78fc5fjpc', {
      get_balance: {}, // or get_price and set the price state
    }).then((res) => {
      console.log(res)
    }).catch((error) => {
      console.log(error)
    })
  }, [signingClient])

  return (
    <WalletLoader>
      <h1 className="text-6xl font-bold">
        Welcome to {process.env.NEXT_PUBLIC_CHAIN_NAME}!
      </h1>

      <div className="mt-3 text-2xl">
        Your wallet address is:{' '}
        <pre className="font-mono break-all whitespace-pre-wrap">
          {walletAddress}
        </pre>
      </div>

      <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 max-w-full sm:w-full">
        <Link href="/purchase" passHref>
          <button className="p-6 mt-6 text-left border border-secondary hover:border-primary w-96 rounded-xl hover:text-primary focus:text-primary-focus">
            <h3 className="text-2xl font-bold">Make a purchase &rarr;</h3>
            <p className="mt-4 text-xl">
              Execute a token sale with Juno.
            </p>
          </button>
        </Link>
      </div>
    </WalletLoader>
  )
}

export default Home
