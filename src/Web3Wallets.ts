import * as evmChains from 'viem/chains'
import type { EIP1193Provider } from 'viem'
import { mainnet, solana, solanaDevnet } from '@reown/appkit/networks'
import type { AppKitNetwork, CaipNetwork } from '@reown/appkit-common'
import { ErrorTypeEnum, WalletPlatformEnum } from '@multiplechain/types'
import type { BaseMessageSignerWalletAdapter } from '@solana/wallet-adapter-base'
import {
    type AppKit as AppKitType,
    type EventsControllerState,
    type CustomWallet,
    type Metadata,
    type ThemeVariables
} from '@reown/appkit'
import type {
    NetworkConfigInterface,
    ProviderInterface,
    WalletAdapterInterface
} from '@multiplechain/types'

const icon =
    'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKIHdpZHRoPSI0MDAuMDAwMDAwcHQiIGhlaWdodD0iNDAwLjAwMDAwMHB0IiB2aWV3Qm94PSIwIDAgNDAwLjAwMDAwMCA0MDAuMDAwMDAwIgogcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCI+Cgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCw0MDAuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIgpmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiPgo8cGF0aCBkPSJNMCAyMDAwIGwwIC0yMDAwIDIwMDAgMCAyMDAwIDAgMCAyMDAwIDAgMjAwMCAtMjAwMCAwIC0yMDAwIDAgMAotMjAwMHogbTIyNjQgNzM2IGMxMjQgLTMyIDI2MSAtOTggMzYzIC0xNzUgOTEgLTY5IDE3MyAtMTUzIDE3MyAtMTc4IDAgLTE3Ci0xODcgLTIwMiAtMjA1IC0yMDMgLTYgMCAtMzEgMjEgLTU1IDQ2IC0yMjcgMjM0IC01NjkgMjk5IC04NTcgMTY0IC03OSAtMzYKLTEzMSAtNzMgLTIxMyAtMTQ5IC0zNiAtMzMgLTcyIC02MCAtODAgLTYxIC0yMCAwIC0yMDAgMTgxIC0yMDAgMjAyIDAgMjQgNDkKNzggMTM2IDE0OCAxMzYgMTA5IDI4MSAxNzkgNDQxIDIxNSAxMDYgMjMgMTE5IDI0IDI2MyAyMCAxMDQgLTMgMTU4IC0xMCAyMzQKLTI5eiBtLTEyODQgLTYwMyBjMTQgLTkgMTMwIC0xMjAgMjU4IC0yNDYgbDIzMyAtMjMxIDU3IDU1IGMzMSAyOSAxNDUgMTQxCjI1MyAyNDYgMTEwIDEwOSAyMDMgMTkzIDIxMyAxOTMgMjAgMCAzOSAtMTggNTIyIC00OTAgMyAtMiA3OCA2OCAxNjcgMTU2IDI3MAoyNjYgMzQ0IDMzNCAzNjIgMzM0IDEwIDAgNTcgLTM5IDEwNiAtODcgNjcgLTY1IDg5IC05MyA4OSAtMTEzIDAgLTIxIC02NiAtOTAKLTM0MSAtMzYwIC0xODggLTE4NCAtMzUwIC0zMzkgLTM2MCAtMzQ0IC0xMSAtNSAtMjcgLTUgLTM4IDAgLTExIDUgLTEyOCAxMTYKLTI2MSAyNDcgLTEzMyAxMzEgLTI0NSAyMzYgLTI0OCAyMzIgLTEzNiAtMTM4IC00OTAgLTQ3MyAtNTA4IC00NzkgLTI4IC0xMQotMTYgLTIyIC00NTEgNDA2IC0yMDMgMTk5IC0yODMgMjg0IC0yODMgMzAwIDAgMjggMTcxIDE5OCAyMDAgMTk4IDMgMCAxNyAtNwozMCAtMTd6Ii8+CjwvZz4KPC9zdmc+Cg=='

type EventFunction = (newEvent: EventsControllerState, appKit?: AppKitType) => void

export interface AppKitConfig {
    projectId: string
    metadata?: Metadata
    events?: EventFunction[]
    themeMode?: 'dark' | 'light'
    customWallets?: CustomWallet[]
    themeVariables?: ThemeVariables
}

let appKit: AppKitType | undefined
let connectRequest: boolean = false
let currentNetwork: AppKitNetwork

export interface EvmNetworkConfigInterface extends NetworkConfigInterface {
    id: number
    hexId?: string
    rpcUrl: string
    name?: string
    mainnetId?: number
    explorerUrl: string
    nativeCurrency: {
        name?: string
        symbol: string
        decimals: number
    }
}

const ourFormatToAppKitFormat = (network: EvmNetworkConfigInterface): AppKitNetwork => {
    return {
        id: network.id,
        testnet: network.testnet,
        name: network.name ?? network.nativeCurrency.symbol,
        nativeCurrency: {
            symbol: network.nativeCurrency.symbol,
            decimals: network.nativeCurrency.decimals,
            name: network.nativeCurrency.name ?? network.nativeCurrency.symbol
        },
        blockExplorers: {
            default: {
                name: network.explorerUrl,
                url: network.explorerUrl,
                apiUrl: network.explorerUrl
            }
        },
        rpcUrls: {
            default: {
                http: [network.rpcUrl]
            }
        }
    }
}

const itsEvmNetwork = (network: NetworkConfigInterface): network is EvmNetworkConfigInterface => {
    return (network as EvmNetworkConfigInterface).id !== undefined
}

const formattedNetworks: AppKitNetwork[] = Object.values(evmChains).filter((chain) => chain.id)

export type WalletProvider = BaseMessageSignerWalletAdapter | EIP1193Provider

let connectResolveMethod: (value: WalletProvider | PromiseLike<WalletProvider>) => void

const createAppKit = async (config: AppKitConfig): Promise<AppKitType> => {
    if (appKit !== undefined) {
        return appKit
    }

    const { createAppKit } = await import('@reown/appkit')
    const { SolanaAdapter } = await import('@reown/appkit-adapter-solana')
    const { EthersAdapter } = await import('@reown/appkit-adapter-ethers')

    const ethersAdapter = new EthersAdapter()

    const solanaWeb3JsAdapter = new SolanaAdapter({
        wallets: []
    })

    appKit = createAppKit({
        projectId: config.projectId,
        themeMode: config.themeMode,
        metadata: config.metadata,
        customWallets: config.customWallets,
        adapters: [ethersAdapter, solanaWeb3JsAdapter],
        networks: [mainnet, ...formattedNetworks, currentNetwork, solana, solanaDevnet],
        themeVariables: config.themeVariables,
        features: {
            email: false,
            socials: false
        }
    })

    if (config.events !== undefined) {
        config.events.forEach((event) => {
            appKit?.subscribeEvents((newEvent: EventsControllerState) => {
                event(newEvent, appKit)
            })
        })
    }

    appKit.subscribeEvents((event: EventsControllerState) => {
        const eventName = event.data?.event
        // @ts-expect-error there is no type for properties
        const name = event.data?.properties?.name
        console.log('Event:', eventName, name)
        if (eventName === 'SELECT_WALLET') {
            if (name !== 'Pay by transfer to address (QR Code)') {
                appKit?.setCaipNetwork(currentNetwork as CaipNetwork)
            }
        }
    })

    appKit.subscribeAccount(async (account) => {
        const walletProvider = appKit?.getWalletProvider() as EIP1193Provider | undefined
        if (account.isConnected && walletProvider !== undefined && connectRequest) {
            connectResolveMethod(walletProvider)
        }
    })

    return appKit
}

const Web3Wallets: WalletAdapterInterface<ProviderInterface, WalletProvider> = {
    icon,
    id: 'web3wallets',
    name: 'Web3 Wallets',
    platforms: [WalletPlatformEnum.UNIVERSAL],
    isDetected: () => true,
    isConnected: () => {
        if (appKit === undefined) {
            return false
        }
        return appKit.getIsConnectedState()
    },
    disconnect: async () => {
        Object.keys(localStorage)
            .filter((x) => {
                return (
                    x.startsWith('wc@2') ||
                    x.startsWith('@w3m') ||
                    x.startsWith('@appkit') ||
                    x.startsWith('W3M') ||
                    x.startsWith('-walletlink')
                )
            })
            .forEach((x) => {
                localStorage.removeItem(x)
            })

        indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB')

        if (appKit?.resetWcConnection !== undefined) {
            appKit.resetWcConnection()
        }
    },
    connect: async (
        provider?: ProviderInterface,
        _config?: AppKitConfig | object
    ): Promise<WalletProvider> => {
        const config = _config as AppKitConfig

        if (provider === undefined) {
            throw new Error(ErrorTypeEnum.PROVIDER_IS_REQUIRED)
        }

        if (config === undefined) {
            throw new Error(ErrorTypeEnum.CONFIG_IS_REQUIRED)
        }

        if (config.projectId === undefined) {
            throw new Error(ErrorTypeEnum.PROJECT_ID_IS_REQUIRED)
        }

        if (itsEvmNetwork(provider.network)) {
            currentNetwork = ourFormatToAppKitFormat(provider.network)
        } else {
            currentNetwork = provider.isTestnet() ? solanaDevnet : solana
        }

        return await new Promise((resolve, reject) => {
            try {
                const run = async (): Promise<void> => {
                    connectRequest = true
                    const appKit = await createAppKit(config)
                    connectResolveMethod = resolve
                    void appKit.open({ view: 'Connect' })
                }

                void run()
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Web3Wallets
