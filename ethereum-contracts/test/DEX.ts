import BN from "bn.js";

import {
    DaiTokenInstance, DEXInstance, DEXReserveInstance, ERC20Instance, RenTokenInstance,
    TestTokenInstance,
} from "../types/truffle-contracts";
import "./helper/testUtils";

const TestToken = artifacts.require("TestToken");
const DAI = artifacts.require("DaiToken");
const DEXReserve = artifacts.require("DEXReserve");
const DEX = artifacts.require("DEX");
const Ren = artifacts.require("RenToken");

contract("DEX", (accounts) => {
    let dai: DaiTokenInstance;
    let token3: TestTokenInstance;
    let dexReserve3: DEXReserveInstance;
    let dex: DEXInstance;
    let ren: RenTokenInstance;

    const randomAddress = accounts[7];

    const dexFees = new BN(10);

    const deadline = 10000000000000;

    before(async () => {
        dai = await DAI.new();
        token3 = await TestToken.new("TestToken1", "TST", 18);
        dexReserve3 = await DEXReserve.new(dai.address, token3.address, dexFees);
        dex = await DEX.new(dai.address);
        await dex.registerReserve(token3.address, dexReserve3.address);
        ren = await Ren.new();
    });

    const depositToReserve = async (baseValue: BN, tokenValue: BN, token: ERC20Instance, reserve: DEXReserveInstance) => {
        await dai.approve(reserve.address, baseValue);
        await token.approve(reserve.address, tokenValue);
        await reserve.addLiquidity(accounts[0], baseValue, tokenValue, deadline);
    };

    const depositToReserveWOToken = async (value: BN, token: ERC20Instance, reserve: DEXReserveInstance) => {
        await dai.approve(reserve.address, value);
        await reserve.addLiquidity(accounts[0], value, 0, deadline).should.be.rejectedWith(/token amount is less than allowed min amount/);
    };

    const depositToReserveWODAI = async (value: BN, token: ERC20Instance, reserve: DEXReserveInstance) => {
        await token.approve(reserve.address, value);
        await reserve.addLiquidity(accounts[0], value, value, deadline).should.be.rejectedWith(/revert/);
    };

    const depositToReserveExpired = async (value: BN, token: ERC20Instance, reserve: DEXReserveInstance) => {
        await dai.approve(reserve.address, value);
        await token.approve(reserve.address, value);
        await reserve.addLiquidity(accounts[0], value, value, 0).should.be.rejectedWith(/addLiquidity request expired/);
    };

    const withdrawFromReserve = async (reserve: DEXReserveInstance) => {
        const liquidity = await reserve.balanceOf.call(accounts[0]);
        await reserve.removeLiquidity(liquidity);
    }

    const maliciousWithdrawFromReserve = async (reserve: DEXReserveInstance) => {
        const liquidity = await reserve.balanceOf.call(accounts[0]);
        await reserve.removeLiquidity(liquidity, { from: accounts[1] }).should.be.rejectedWith(/insufficient balance/);
    }

    const sellBaseToken = async (srcToken: ERC20Instance, dstToken: ERC20Instance) => {
        const value = new BN(225000);
        const reserve = await dex.reserves.call(dstToken.address);
        const amount = await dex.calculateReceiveAmount.call(srcToken.address, dstToken.address, value);
        await srcToken.approve(dex.address, value);
        const initialBalance = new BN((await dstToken.balanceOf.call(reserve)).toString());
        await dex.trade(
            accounts[0], srcToken.address, dstToken.address, value,
        );
        const finalBalance = new BN((await dstToken.balanceOf.call(reserve)).toString());
        initialBalance.sub(finalBalance).should.bignumber.equal(amount);
    }

    it("should fail to overwrite an existing reserve", async () => {
        await dex.registerReserve(token3.address, accounts[3]).should.be.rejectedWith(/token reserve already registered/);
    });

    it("should fail to calculate the base token value", async () => {
        const value = new BN(20000000000);
        await dexReserve3.calculateBaseTokenValue(value).should.be.rejectedWith(/division by zero/);
    });

    it("should fail to calculate the base token value", async () => {
        const value = new BN(20000000000);
        await dexReserve3.calculateQuoteTokenValue(value).should.be.rejectedWith(/division by zero/);
    });

    it("should fail to trade unsupported tokens", async () => {
        await dex.trade(accounts[0], dai.address, randomAddress, 1000).should.be.rejectedWith(/unsupported token/);
    });

    it("should fail to trade unsupported tokens", async () => {
        await dex.trade(accounts[0], randomAddress, dai.address, 1000).should.be.rejectedWith(/unsupported token/);
    });

    it("should fail to trade unsupported tokens", async () => {
        await dex.trade(accounts[0], randomAddress, randomAddress, 1000).should.be.rejectedWith(/unsupported token/);
    });

    it("should deposit token3 to the reserve3", async () => {
        const value = new BN(20000000000);
        await depositToReserveWODAI(value, token3, dexReserve3);
    });

    it("should deposit token3 to the reserve3", async () => {
        const daiValue = new BN(20000000000);
        const tokenValue = new BN(20000000000);
        await depositToReserve(daiValue, tokenValue, token3, dexReserve3);
    });

    it("should deposit token3 to the reserve3", async () => {
        const value = new BN(20000000000);
        await depositToReserveWODAI(value, token3, dexReserve3);
    });

    it("should deposit token3 to the reserve3", async () => {
        const value = new BN(20000000000);
        await depositToReserveWOToken(value, token3, dexReserve3);
    });

    it("should deposit token3 to the reserve3 when it has liquidity", async () => {
        const daiValue = new BN(20000000000);
        const tokenValue = new BN(20000000000);
        await depositToReserve(daiValue, tokenValue, token3, dexReserve3);
    });

    it("should deposit token3 to the reserve3 when it has liquidity", async () => {
        const value = new BN(20000000000);
        await depositToReserveExpired(value, token3, dexReserve3);
    });

    it("should trade dai to token3 on DEX", async () => {
        await sellBaseToken(dai, token3);
    });

    it("should not withdraw dai and token3 from the reserve3 if the user does not have liquidity tokens", async () => await maliciousWithdrawFromReserve(dexReserve3));

    it("should withdraw dai and token3 from the reserve3", async () => await withdrawFromReserve(dexReserve3));

    it("should be able to withdraw funds that are mistakenly sent to dex", async () => {
        await dai.transfer(dex.address, 1000);
        const initialBalance = new BN((await dai.balanceOf.call(accounts[0])).toString());
        await dex.recoverTokens(dai.address, { from: accounts[0] });
        const finalBalance = new BN((await dai.balanceOf.call(accounts[0])).toString());
        finalBalance.sub(initialBalance).should.bignumber.equal(1000);
    });

    it("should be able to withdraw funds that are mistakenly sent to dex reserve", async () => {
        const reserve = await DEXReserve.at(await dex.reserves.call(token3.address));
        await dai.transfer(reserve.address, 1000);
        await ren.transfer(reserve.address, 1000);

        const initialDaiBalance = new BN((await dai.balanceOf.call(accounts[1])).toString());
        const initialTokenBalance = new BN((await ren.balanceOf.call(accounts[1])).toString());

        // Can't recover DAI
        await reserve.recoverTokens(dai.address, { from: accounts[1] })
            .should.be.rejectedWith(/not allowed to recover reserve tokens/);

        // Can't recover quote token
        await reserve.recoverTokens(token3.address, { from: accounts[1] })
            .should.be.rejectedWith(/not allowed to recover reserve tokens/);

        // Can recover unrelated token
        await reserve.recoverTokens(ren.address, { from: accounts[1] });
        const finalDaiBalance = new BN((await dai.balanceOf.call(accounts[1])).toString());
        const finalTokenBalance = new BN((await ren.balanceOf.call(accounts[1])).toString());
        finalDaiBalance.should.bignumber.equal(initialDaiBalance);
        finalTokenBalance.sub(initialTokenBalance).should.bignumber.equal(1000);
    });
});
