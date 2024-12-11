import BN from 'bn.js';
export { default as BN } from 'bn.js';
import Decimal from 'decimal.js';
export { default as Decimal } from 'decimal.js';
import { SuiObjectResponse, SuiClient, SuiClientOptions, SuiObjectRef, OwnedObjectRef, SuiMoveObject, SuiObjectData, MoveStruct } from '@mysten/sui/client';
import { Keypair } from '@mysten/sui/cryptography';
import { Transaction, TransactionObjectArgument } from '@mysten/sui/transactions';
import * as _mysten_sui_dist_cjs_transactions from '@mysten/sui/dist/cjs/transactions';
import * as _mysten_sui_dist_cjs_client from '@mysten/sui/dist/cjs/client';

declare enum Network {
    mainnet = "mainnet",
    testnet = "testnet",
    /**
     * Using testnet connection
     */
    devnet = "devnet"
}

declare const MAX_TICK_INDEX = 443636;
declare const MIN_TICK_INDEX = -443636;
declare const MAX_SQRT_PRICE = "79226673515401279992447579055";
declare const MIN_SQRT_PRICE = "4295048016";
declare const BIT_PRECISION = 14;
declare const LOG_B_2_X32 = "59543866431248";
declare const LOG_B_P_ERR_MARGIN_LOWER_X64 = "184467440737095516";
declare const LOG_B_P_ERR_MARGIN_UPPER_X64 = "15793534762490258745";

declare module Account {
    interface DerivePathOptions {
        accountIndex?: number;
        isExternal?: boolean;
        addressIndex?: number;
    }
}
declare class Account {
    generateMnemonic(numberOfWords?: 12 | 24): string;
    getKeypairFromMnemonics(mnemonics: string, path?: Account.DerivePathOptions): Keypair;
    protected getDerivePath(path?: Account.DerivePathOptions): string;
}

declare module Pool {
    interface MintParams {
        /**
         * Pool ID
         */
        pool: string;
        address: string;
        amountA: string | number;
        amountB: string | number;
        /**
         * Acceptable wasted amount. Range: `[0, 100)`, unit: `%`
         */
        slippage: string | number;
        deadline?: number;
        txb?: Transaction;
    }
    interface LiquidityParams {
        tickLower: number;
        tickUpper: number;
    }
    interface CreatePoolOptions extends Omit<MintParams, 'pool'>, LiquidityParams {
        /**
         * Fee object from `sdk.contract.getFees()`
         */
        fee: Contract.Fee;
        /**
         * Coin type such as `0x2::sui::SUI`
         */
        coinTypeA: string;
        coinTypeB: string;
        sqrtPrice: string;
    }
    interface AddLiquidityOptions extends MintParams, LiquidityParams {
    }
    interface IncreaseLiquidityOptions extends MintParams {
        /**
         * NFT ID
         */
        nft: string;
    }
    interface DecreaseLiquidityOptions extends MintParams {
        /**
         * NFT ID
         */
        nft: string;
        decreaseLiquidity: string | number;
    }
    interface RemoveLiquidityOptions extends DecreaseLiquidityOptions, CollectFeeOptions, CollectRewardOptions {
    }
    interface CollectFeeOptions extends Pick<Pool.MintParams, 'pool' | 'txb' | 'address' | 'deadline'> {
        /**
         * NFT ID
         */
        nft: string;
        collectAmountA: string | number;
        collectAmountB: string | number;
    }
    interface CollectRewardOptions extends Pick<Pool.MintParams, 'pool' | 'txb' | 'address' | 'deadline'> {
        /**
         * NFT ID
         */
        nft: string;
        rewardAmounts: (string | number)[];
    }
    /**
     * Pool fields from `provider.getObject()` while turning on `showContent` option.
     */
    interface PoolFields {
        coin_a: string;
        coin_b: string;
        deploy_time_ms: string;
        fee: number;
        fee_growth_global_a: string;
        fee_growth_global_b: string;
        fee_protocol: number;
        id: {
            id: string;
        };
        liquidity: string;
        max_liquidity_per_tick: string;
        protocol_fees_a: string;
        protocol_fees_b: string;
        reward_infos: {
            type: string;
            fields: {
                emissions_per_second: string;
                growth_global: string;
                id: {
                    id: string;
                };
                manager: string;
                vault: string;
                vault_coin_type: string;
            };
        }[];
        reward_last_updated_time_ms: string;
        sqrt_price: string;
        tick_current_index: {
            type: string;
            fields: {
                bits: number;
            };
        };
        tick_map: {
            type: string;
            fields: {
                id: {
                    id: string;
                };
                size: string;
            };
        };
        tick_spacing: number;
        unlocked: boolean;
    }
    type Types = [string, string, string];
    interface Pool extends PoolFields {
        objectId: string;
        type: string;
        types: Types;
    }
}
declare class Pool extends Base {
    /**
     * Get Turbos unlocked pools
     * @param withLocked Defaults `false`
     */
    getPools(withLocked?: boolean): Promise<Pool.Pool[]>;
    getPool(poolId: string): Promise<Pool.Pool>;
    createPool(options: Pool.CreatePoolOptions): Promise<Transaction>;
    addLiquidity(options: Pool.AddLiquidityOptions): Promise<Transaction>;
    increaseLiquidity(options: Pool.IncreaseLiquidityOptions): Promise<Transaction>;
    decreaseLiquidity(options: Pool.DecreaseLiquidityOptions): Promise<Transaction>;
    removeLiquidity(options: Pool.RemoveLiquidityOptions): Promise<Transaction>;
    collectFee(options: Pool.CollectFeeOptions): Promise<Transaction>;
    collectReward(options: Pool.CollectRewardOptions): Promise<Transaction>;
    getTokenAmountsFromLiquidity(options: {
        currentSqrtPrice: BN;
        lowerSqrtPrice: BN;
        upperSqrtPrice: BN;
        /**
         * Defaults `BN(100_000_000)`
         */
        liquidity?: BN;
        /**
         * Defaults `true`
         */
        ceil?: boolean;
    }): [a: BN, b: BN];
    getPoolTypeArguments(poolId: string): Promise<Pool.Types>;
    parsePoolType(type: string, length: 2): [string, string];
    parsePoolType(type: string, length: 3): Pool.Types;
    parsePoolType(type: string): string[];
    /**
     * Calculate liquidity by given amount and price.
     * It's useful for increase liquidity or creating pool which includes increase liquidity.
     */
    getFixedLiquidity(options: {
        coinTypeA: string;
        coinTypeB: string;
        amountA: string | number;
        amountB: string | number;
        priceA: string | number | undefined;
        priceB: string | number | undefined;
    }): Promise<{
        liquidityA: string;
        liquidityB: string;
        liquidity: string;
    }>;
    protected parsePool(pool: SuiObjectResponse): Pool.Pool;
    protected getMinimumAmountBySlippage(amount: Decimal.Value, slippage: Decimal.Value): string;
}

declare const ONE_MINUTE: number;
declare module Trade {
    interface SwapOptions {
        routes: {
            pool: string;
            a2b: boolean;
            /**
             * ```typescript
             * const swapResult = sdk.trade.computeSwapResult({ ... })
             * const nextTickIndex = sdk.math.bitsToNumber(swapResult.tick_current_index.bits)
             * ```
             */
            nextTickIndex: number;
        }[];
        coinTypeA: string;
        coinTypeB: string;
        address: string;
        amountA: string | number;
        amountB: string | number;
        amountSpecifiedIsInput: boolean;
        slippage: string;
        deadline?: number;
        txb?: Transaction;
    }
    interface ComputeSwapResultOptions {
        pools: {
            pool: string;
            a2b: boolean;
        }[];
        address: string;
        amountSpecified: string | number;
        amountSpecifiedIsInput: boolean;
        tickStep?: number;
    }
    interface ComputeSwapResultOptionsV2 {
        pools: {
            pool: string;
            a2b: boolean;
            amountSpecified: string | number;
        }[];
        address: string;
        amountSpecifiedIsInput: boolean;
        tickStep?: number;
    }
    interface ComputedSwapResult {
        a_to_b: boolean;
        amount_a: string;
        amount_b: string;
        fee_amount: string;
        is_exact_in: boolean;
        liquidity: string;
        pool: string;
        protocol_fee: string;
        recipient: string;
        sqrt_price: string;
        tick_current_index: {
            bits: number;
        };
        tick_pre_index: {
            bits: number;
        };
    }
    interface SwapWithReturnOptions {
        poolId: string;
        coinType: string;
        amountA: string;
        amountB: string;
        swapAmount: string;
        nextTickIndex: number;
        slippage: string;
        amountSpecifiedIsInput: boolean;
        a2b: boolean;
        address: string;
        deadline?: number;
        txb?: Transaction;
    }
}
declare class Trade extends Base {
    swap(options: Trade.SwapOptions): Promise<Transaction>;
    computeSwapResult(options: Trade.ComputeSwapResultOptions): Promise<Trade.ComputedSwapResult[]>;
    computeSwapResultV2(options: Trade.ComputeSwapResultOptionsV2): Promise<Trade.ComputedSwapResult[]>;
    swapWithReturn(options: Trade.SwapWithReturnOptions): Promise<{
        txb: Transaction;
        coinVecA: {
            $kind: "NestedResult";
            NestedResult: [number, number];
        } | undefined;
        coinVecB: {
            $kind: "NestedResult";
            NestedResult: [number, number];
        } | undefined;
    }>;
    protected getFunctionNameAndTypeArguments(pools: Pool.Types[], coinTypeA: string, coinTypeB: string): {
        functionName: string;
        typeArguments: string[];
    };
    amountOutWithSlippage(amountOut: Decimal, slippage: string, amountSpecifiedIsInput: boolean): string;
    sqrtPriceWithSlippage(price: Decimal, slippage: string, a2b: boolean, decimalsA: number, decimalsB: number): string;
}

declare class Coin extends Base {
    isSUI(coinType: string): boolean;
    getMetadata(coinType: string): Promise<_mysten_sui_dist_cjs_client.CoinMetadata>;
    selectTradeCoins(owner: string, coinType: string, expectedAmount: Decimal): Promise<string[]>;
    convertTradeCoins(txb: Transaction, coinIds: string[], coinType: string, amount: Decimal): TransactionObjectArgument[];
    zero(token: string, txb: Transaction): TransactionObjectArgument;
    formatCoinType(type: string, fillZero?: boolean): string;
    takeAmountFromCoins(address: string, coinType: string, amount: number, txb: Transaction): Promise<({
        $kind: "Input";
        Input: number;
        type?: "object" | undefined;
    } | _mysten_sui_dist_cjs_transactions.TransactionResult)[]>;
    splitSUIFromGas(amount: number[], txb: Transaction): _mysten_sui_dist_cjs_transactions.TransactionResult;
    splitMultiCoins(coins: string[], amounts: number[], txb: Transaction): ({
        $kind: "Input";
        Input: number;
        type?: "object" | undefined;
    } | _mysten_sui_dist_cjs_transactions.TransactionResult)[];
}

declare module NFT {
    interface NftField {
        description: string;
        id: {
            id: string;
        };
        img_url: string;
        name: string;
        pool_id: string;
        position_id: string;
    }
    interface PositionField {
        fee_growth_inside_a: string;
        fee_growth_inside_b: string;
        id: {
            id: string;
        };
        liquidity: string;
        reward_infos: {
            type: string;
            fields: {
                amount_owed: string;
                reward_growth_inside: string;
            };
        }[];
        tick_lower_index: {
            type: string;
            fields: {
                bits: number;
            };
        };
        tick_upper_index: {
            type: string;
            fields: {
                bits: number;
            };
        };
        tokens_owed_a: string;
        tokens_owed_b: string;
    }
    interface PositionTickField {
        id: {
            id: string;
        };
        name: {
            type: string;
            fields: {
                bits: number;
            };
        };
        value: {
            type: string;
            fields: {
                fee_growth_outside_a: string;
                fee_growth_outside_b: string;
                id: {
                    id: string;
                };
                initialized: boolean;
                liquidity_gross: string;
                liquidity_net: {
                    fields: {
                        bits: string;
                    };
                    type: string;
                };
                reward_growths_outside: [string, string, string];
            };
        };
    }
    interface PositionTick {
        tickIndex: number;
        initialized: boolean;
        liquidityNet: BN;
        liquidityGross: BN;
        feeGrowthOutsideA: BN;
        feeGrowthOutsideB: BN;
        rewardGrowthsOutside: [BN, BN, BN];
    }
    interface BurnOptions {
        pool: string;
        nft: string;
        txb?: Transaction;
    }
}
declare class NFT extends Base {
    getOwner(nftId: string): Promise<string | undefined>;
    getFields(nftId: string): Promise<NFT.NftField>;
    getPositionFields(nftId: string): Promise<NFT.PositionField>;
    getPositionFieldsByPositionId(positionId: string): Promise<NFT.PositionField>;
    getPositionTick(pool: string, tickIndex: NFT.PositionField['tick_lower_index'] | NFT.PositionField['tick_upper_index']): Promise<NFT.PositionTick | undefined>;
    getPositionAPR(opts: {
        poolId: string;
        tickLower: number;
        tickUpper: number;
        fees24h: string | number;
        getPrice(coinType: string): Promise<string | number | undefined>;
    }): Promise<{
        fees: string;
        total: string;
        rewards: string;
    }>;
    protected getRemoveLiquidityQuote(pool: Pool.PoolFields, tickLower: number, tickUpper: number): {
        minTokenA: BN;
        minTokenB: BN;
    };
    protected adjustForSlippage(n: BN): BN;
    protected getTokenAFromLiquidity(liquidity: BN, sqrtPriceLowerX64: BN, sqrtPriceUpperX64: BN): BN;
    protected getTokenBFromLiquidity(liquidity: BN, sqrtPriceLowerX64: BN, sqrtPriceUpperX64: BN): BN;
    burn(options: NFT.BurnOptions): Promise<Transaction>;
    getPositionLiquidityUSD(options: {
        poolId: string;
        position: NFT.PositionField;
        priceA: string | number | undefined;
        priceB: string | number | undefined;
    }): Promise<string>;
    getUnclaimedFeesAndRewards(options: {
        poolId: string;
        position: NFT.PositionField;
        getPrice(coinType: string): Promise<string | number | undefined>;
    }): Promise<{
        fees: string;
        rewards: string;
        total: string;
        fields: {
            collectRewards: [string, string, string];
            scaledCollectRewards: [string, string, string];
            feeOwedA: string;
            feeOwedB: string;
            scaledFeeOwedA: string;
            scaledFeeOwedB: string;
        };
    }>;
    protected getUnclaimedFees(options: {
        pool: Pool.Pool;
        position: NFT.PositionField;
        getPrice(coinType: string): Promise<string | number | undefined>;
        tickLowerDetail: NFT.PositionTick;
        tickUpperDetail: NFT.PositionTick;
    }): Promise<{
        feeOwedA: string;
        feeOwedB: string;
        unclaimedFees: Decimal;
        scaledFeeOwedA: string;
        scaledFeeOwedB: string;
    }>;
    protected getUnclaimedRewards(options: {
        pool: Pool.Pool;
        position: NFT.PositionField;
        getPrice(coinType: string): Promise<string | number | undefined>;
        tickLowerDetail: NFT.PositionTick;
        tickUpperDetail: NFT.PositionTick;
    }): Promise<{
        unclaimedRewards: Decimal;
        collectRewards: [string, string, string];
        scaledCollectRewards: [string, string, string];
    }>;
    protected getObject(nftId: string): Promise<SuiObjectResponse>;
}

declare class MathUtil {
    priceToSqrtPriceX64(price: Decimal.Value, decimalsA: number, decimalsB: number): BN;
    sqrtPriceX64ToPrice(sqrtPriceX64: BN, decimalsA: number, decimalsB: number): Decimal;
    priceToTickIndex(price: Decimal.Value, decimalsA: number, decimalsB: number): number;
    sqrtPriceX64ToTickIndex(sqrtPriceX64: BN): number;
    tickIndexToSqrtPriceX64(tickIndex: number): BN;
    tickIndexToPrice(tickIndex: number, decimalsA: number, decimalsB: number): Decimal;
    toX64_Decimal(num: Decimal): Decimal;
    fromX64_Decimal(num: Decimal): Decimal;
    scaleDown(value: Decimal.Value, decimals: number): string;
    scaleUp(value: Decimal.Value, decimals: number): string;
    bitsToNumber(bits: number | string, len?: number): number;
    subUnderflowU128(n0: BN, n1: BN): BN;
    protected tickIndexToSqrtPricePositive(tick: number): BN;
    protected tickIndexToSqrtPriceNegative(tickIndex: number): BN;
    protected signedShiftLeft(n0: BN, shiftBy: number, bitWidth: number): BN;
    protected signedShiftRight(n0: BN, shiftBy: number, bitWidth: number): BN;
}

declare class Base {
    protected readonly sdk: TurbosSdk;
    private _lru;
    private _fetching;
    constructor(sdk: TurbosSdk);
    protected getCacheOrSet<T>(key: string, orSet: () => Promise<T>, durationMS?: number): Promise<T>;
    protected get provider(): _mysten_sui_dist_cjs_client.SuiClient;
    protected get math(): MathUtil;
    protected get account(): Account;
    protected get network(): Network;
    protected get contract(): Contract;
    protected get nft(): NFT;
    protected get coin(): Coin;
    protected get trade(): Trade;
    protected get pool(): Pool;
}

/// <reference lib="dom" />

declare module Contract {
    interface Fee {
        fee: number;
        objectId: string;
        type: string;
        tickSpacing: number;
    }
    interface Config {
        PackageId: string;
        PackageIdOriginal: string;
        PoolConfig: string;
        Positions: string;
        PoolFactoryAdminCap: string;
        Versioned: string;
        PoolTableId: string;
        VaultOriginPackageId: string;
        VaultPackageId: string;
        VaultGlobalConfig: string;
        VaultRewarderManager: string;
        VaultUserTierConfig: string;
    }
}
declare class Contract extends Base {
    getConfig(): Promise<Contract.Config>;
    getFees(): Promise<Contract.Fee[]>;
    private fetchJSON;
}

declare module Vault {
    interface VaultStrategyField {
        clmm_pool_id: string;
        id: {
            id: string;
        };
        coin_a_type_name: {
            fields: {
                name: string;
            };
            type: string;
        };
        coin_b_type_name: {
            fields: {
                name: string;
            };
            type: string;
        };
        effective_tick_lower: {
            fields: {
                bits: number;
            };
            type: string;
        };
        effective_tick_upper: {
            fields: {
                bits: number;
            };
            type: string;
        };
        total_share: string;
        vaults: {
            fields: {
                id: {
                    id: string;
                };
            };
        };
        accounts: {
            fields: {
                id: {
                    id: string;
                };
            };
        };
        default_base_rebalance_threshold: number;
        default_limit_rebalance_threshold: number;
        base_tick_step_minimum: number;
        limit_tick_step_minimum: number;
        fee_type_name: {
            fields: {
                name: string;
            };
        };
    }
    interface VaultsIdMyStrategyVaultField {
        name: string;
        value: {
            fields: {
                value: {
                    fields: {
                        sqrt_price: string;
                        strategy_id: string;
                        vault_id: string;
                        base_liquidity: string;
                        limit_liquidity: string;
                        limit_clmm_position_id: string;
                        base_clmm_position_id: string;
                        base_lower_index: {
                            fields: {
                                bits: number;
                            };
                        };
                        base_upper_index: {
                            fields: {
                                bits: number;
                            };
                        };
                        limit_lower_index: {
                            fields: {
                                bits: number;
                            };
                        };
                        limit_upper_index: {
                            fields: {
                                bits: number;
                            };
                        };
                        coin_a_type_name: {
                            fields: {
                                name: string;
                            };
                        };
                        coin_b_type_name: {
                            fields: {
                                name: string;
                            };
                        };
                    };
                };
            };
        };
    }
    interface CreateAndDepositVaultArguments {
        txb?: Transaction;
        deadline?: number;
        address: string;
        strategyId: string;
        poolId: string;
        coinTypeA: string;
        coinTypeB: string;
        amountA: string;
        amountB: string;
        baseLowerIndex: number;
        baseUpperIndex: number;
        limitLowerIndex: number;
        limitUpperIndex: number;
        baseTickStep: number;
        limitTickStep: number;
    }
    interface CreateVaultArguments extends Pick<Vault.CreateAndDepositVaultArguments, 'strategyId' | 'txb' | 'address' | 'baseLowerIndex' | 'baseUpperIndex' | 'limitLowerIndex' | 'limitUpperIndex'> {
    }
    interface DepositVaultArguments extends Pick<Vault.CreateAndDepositVaultArguments, 'strategyId' | 'txb' | 'address' | 'deadline' | 'poolId' | 'coinTypeA' | 'coinTypeB' | 'amountA' | 'amountB'> {
        vaultId: string;
    }
    interface WithdrawVaultArguments {
        txb?: Transaction;
        deadline?: number;
        slippage?: string | number;
        strategyId: string;
        vaultId: string;
        poolId: string;
        address: string;
        percentage: number;
        onlyTokenA?: boolean;
        onlyTokenB?: boolean;
    }
    interface collectClmmRewardDirectReturnVaultArguments {
        txb?: Transaction;
        address: string;
        strategyId: string;
        poolId: string;
        vaultId: string;
    }
    interface CloseVaultArguments {
        txb?: Transaction;
        strategyId: string;
        vaultId: string;
    }
    interface withdrawAllVaultArguments extends WithdrawVaultArguments, collectClmmRewardDirectReturnVaultArguments, CloseVaultArguments {
    }
    interface OnlyTokenSwapWithReturnOptions extends Pick<Vault.CreateAndDepositVaultArguments, 'coinTypeA' | 'coinTypeB' | 'amountA' | 'amountB' | 'poolId' | 'address' | 'txb' | 'deadline'> {
        liquidity: string;
        sqrt_price: string;
        lowerIndex: number;
        upperIndex: number;
        a2b: boolean;
        slippage?: string | number;
    }
    interface VaultWithdrawEvents {
        amount_a: string;
        amount_b: string;
        percentage: string;
    }
    interface EventParseJson {
        a_to_b: boolean;
        amount_a: string;
        amount_b: string;
        tick_current_index: {
            bits: number;
        };
        tick_pre_index: {
            bits: number;
        };
    }
    interface VaultBalanceAmountOptions {
        strategyId: string;
        vaultId: string;
        coinTypeA: string;
        coinTypeB: string;
        address: string;
    }
    interface MyVaultOwnedObjects {
        description: string;
        id: {
            id: string;
        };
        name: string;
        strategy_id: string;
        url: string;
        coin_a_type_name: {
            fields: {
                name: string;
            };
        };
        coin_b_type_name: {
            fields: {
                name: string;
            };
        };
    }
    interface TurbosMyVaultPosition extends NFT.PositionField {
        tickLower: number;
        tickUpper: number;
        objectId: string;
    }
    interface TurbosMyVault {
        coinTypeA: string;
        coinTypeB: string;
        strategyId: string;
        url: string;
        name: string;
        id: string;
        nftId: string;
        vaultId: string;
        baseLowerTick: number;
        baseUpperTick: number;
        limitLowerTick: number;
        limitUpperTick: number;
        sqrt_price: string;
        base_liquidity: string;
        limit_liquidity: string;
        clmm_pool_id: string;
        limit_clmm_position_id: string;
        base_clmm_position_id: string;
        accountsId: string;
        limit_clmm_position?: TurbosMyVaultPosition;
        base_clmm_position?: TurbosMyVaultPosition;
    }
    interface TurbosVaultAmount extends Pick<TurbosMyVault, 'strategyId' | 'vaultId' | 'base_liquidity' | 'limit_liquidity' | 'baseLowerTick' | 'baseUpperTick' | 'limitLowerTick' | 'limitUpperTick' | 'coinTypeA' | 'coinTypeB'> {
        address: string;
        poolSqrtPrice: string;
    }
}
declare class Vault extends Base {
    createAndDepositVault(options: Vault.CreateAndDepositVaultArguments): Promise<Transaction>;
    createVault(options: Vault.CreateVaultArguments): Promise<Transaction>;
    depositVault(options: Vault.DepositVaultArguments): Promise<Transaction>;
    withdrawVaultV2(options: Vault.WithdrawVaultArguments): Promise<Transaction>;
    collectClmmRewardDirectReturnVault(options: Vault.collectClmmRewardDirectReturnVaultArguments): Promise<Transaction>;
    closeVault(options: Vault.CloseVaultArguments): Promise<Transaction>;
    withdrawAllVault(options: Vault.withdrawAllVaultArguments): Promise<Transaction>;
    computeTokenWithdrawVaultSwapResult(options: Vault.WithdrawVaultArguments): Promise<{
        amountA: string;
        amountB: string;
        resultAmountA: string;
        resultAmountB: string;
        sqrt_price: string;
        current_index: number;
        prev_index: number;
        a2b: boolean;
    }>;
    protected onlyTokenSwapWithReturn(options: Vault.OnlyTokenSwapWithReturnOptions): Promise<{
        txb: Transaction;
        coinVecA: {
            $kind: "NestedResult";
            NestedResult: [number, number];
        } | undefined;
        coinVecB: {
            $kind: "NestedResult";
            NestedResult: [number, number];
        } | undefined;
        swapResultSqrtPrice: string;
    }>;
    protected onlyTokenWithdrawVault(options: Vault.WithdrawVaultArguments): Promise<Transaction>;
    protected getStrategy(strategyId: string): Promise<Vault.VaultStrategyField>;
    protected getStrategyVault(vaultId: string, vaultValue: string): Promise<Vault.VaultsIdMyStrategyVaultField>;
    getCalculateVaultStepTick(step: number, tick_spacing: string, sqrt_price: string): [number, number];
    getVaultBalanceAmount(options: Vault.VaultBalanceAmountOptions): Promise<[string, string]>;
    getMyVaults(address: string): Promise<Vault.TurbosMyVault[]>;
    getVaultAmount(options: Vault.TurbosVaultAmount): Promise<[string, string]>;
}

declare class TurbosSdk {
    readonly network: Network;
    readonly pool: Pool;
    readonly contract: Contract;
    readonly math: MathUtil;
    readonly account: Account;
    readonly coin: Coin;
    readonly nft: NFT;
    readonly trade: Trade;
    readonly provider: SuiClient;
    readonly vault: Vault;
    constructor(network: Network, clientOrOptions?: SuiClientOptions | SuiClient);
}

declare function getObjectId(data: SuiObjectResponse | SuiObjectRef | OwnedObjectRef): string;
declare function getObjectFields(resp: SuiObjectResponse | SuiMoveObject | SuiObjectData): MoveStruct | undefined;

/**
 * deprecated pool rewards position index
 */
declare const deprecatedPoolRewards: (pool: string, index: number) => boolean;
declare const isDeprecatedPool: (pool: string) => boolean;

export { Account, BIT_PRECISION, Coin, Contract, LOG_B_2_X32, LOG_B_P_ERR_MARGIN_LOWER_X64, LOG_B_P_ERR_MARGIN_UPPER_X64, MAX_SQRT_PRICE, MAX_TICK_INDEX, MIN_SQRT_PRICE, MIN_TICK_INDEX, MathUtil, NFT, Network, ONE_MINUTE, Pool, Trade, TurbosSdk, Vault, deprecatedPoolRewards, isDeprecatedPool, getObjectFields as unstable_getObjectFields, getObjectId as unstable_getObjectId };
