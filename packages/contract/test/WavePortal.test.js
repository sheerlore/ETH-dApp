const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const hre = require('hardhat');
const { expect } = require('chai');
const { ethers } = require('hardhat')

describe("WavePortal", function () {
    async function deployProjectFixture() {
        const wavePortalFactory = await ethers.getContractFactory("WavePortal");

        const [user1, user2] = await ethers.getSigners();

        const wavePortal = await wavePortalFactory.deploy({
            value: hre.ethers.utils.parseEther('0.1'),
        });

        await wavePortal.deployed();

        const wavePortalBalance = hre.ethers.utils.formatEther(
            await hre.ethers.provider.getBalance(wavePortal.address),
        );

        const sendTwoWaves = async () => {
            await wavePortal.connect(user1).wave("This is wave #1");
            await wavePortal.connect(user2).wave("This is wave #2");
        };
        return { wavePortal, wavePortalBalance, sendTwoWaves, user1, user2 };
    }

    describe("gettotalWaves", function () {
        it("should return total waves", async function () {
            const { wavePortal, sendTwoWaves } = await loadFixture(deployProjectFixture);
            await sendTwoWaves();

            const totalWaves = await wavePortal.getTotalWaves();

            expect(totalWaves).to.equal(2);
        })
    });

    describe("getAllWaves", function () {
        it("should return all waves", async function () {
            const { wavePortal, sendTwoWaves, user1, user2 } = await loadFixture(deployProjectFixture);
            await sendTwoWaves();

            const allWaves = await wavePortal.getAllWaves();

            expect(allWaves[0].waver).to.equal(user1.address);
            expect(allWaves[0].message).to.equal("This is wave #1");
            expect(allWaves[1].waver).to.equal(user2.address);
            expect(allWaves[1].message).to.equal("This is wave #2");
        })
    });

    describe("wave", function () {
        context("when user waved", function () {
            it("should send tokens at random.", async function () {
                const { wavePortal, wavePortalBalance, sendTwoWaves } = await loadFixture(deployProjectFixture);
                await sendTwoWaves();

                const wavePortalBalanceAfter = hre.ethers.utils.formatEther(
                    await hre.ethers.provider.getBalance(wavePortal.address)
                );

                const allWaves = await wavePortal.getAllWaves();
                let cost = 0;
                for (let i = 0; i < allWaves.length; i++) {
                    if (allWaves[i].seed <= 50) {
                        cost += 0.0001;
                    }
                }

                expect(parseFloat(wavePortalBalanceAfter)).to.equal(wavePortalBalance - cost);
            })
        })
        context(
            "When user1 tried to resubmit without waiting 15 minutes",
            function () {
                it("reverts", async function () {
                    const { wavePortal, user1 } = await loadFixture(deployProjectFixture);

                    await wavePortal.connect(user1).wave("This is wave #1");

                    await expect(
                        wavePortal.connect(user1).wave("This is wave #2")
                    ).to.be.revertedWith("Wait 15m");
                })
            }
        )
    });

})
