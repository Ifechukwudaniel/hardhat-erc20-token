const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, INITIAL_SUPPLY } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("OurToken Unit Test", () => {
          let deployer, user1, ourToken, playerToken
          let multiplier = 10 ** 18
          beforeEach(async () => {
              const namedAccounts = await getNamedAccounts()
              deployer = namedAccounts.deployer
              user1 = namedAccounts.user1
              await deployments.fixture(["all"])
              ourToken = await ethers.getContract("OurToken", deployer)
          })

          describe("constructor", () => {
              it("should have correct initial supply of tokens ", async () => {
                  const totalSupply = await ourToken.totalSupply()
                  assert(totalSupply.toString(), INITIAL_SUPPLY)
              })
              it("should  have correct name and symbol", async () => {
                  const name = await ourToken.name().toString()
                  assert(name, "OurToken")

                  const symbol = await ourToken.symbol().toString()
                  assert(symbol, "OT")
              })
          })

          describe("minting", () => {
              it("should not allow user to mint", async () => {
                  try {
                      await ourToken._mint(deployer, 100)
                      assert(false)
                  } catch (e) {
                      assert(e)
                  }
              })
          })

          describe("transfer", () => {
              it("should be able to transfer tokens to an address", async () => {
                  const tokensToSend = ethers.utils.parseEther("10")
                  await ourToken.transfer(user1, tokensToSend)
                  expect(await ourToken.balanceOf(user1)).equal(tokensToSend)
              })
              it("should emit a transfer even when a transfer occurred", async () => {
                  await expect(ourToken.transfer(user1, (10 * multiplier).toString())).to.emit(
                      ourToken,
                      "Transfer"
                  )
              })
          })

          describe("allowance", () => {
              let amount = (20 * multiplier).toString()
              beforeEach(async () => {
                  playerToken = await ethers.getContract("OurToken", user1)
              })

              it("Should approve other address to spend token", async () => {
                  const tokensToSpend = ethers.utils.parseEther("5")
                  await ourToken.approve(user1, tokensToSpend)
                  const ourToken1 = await ethers.getContract("OurToken", user1)
                  await ourToken1.transferFrom(deployer, user1, tokensToSpend)
                  expect(await ourToken1.balanceOf(user1)).to.equal(tokensToSpend)
              })
              it("doesn't allow an unnaproved member to do transfers", async () => {
                  //Deployer is approving that user1 can spend 20 of their precious OT's

                  await expect(
                      playerToken.transferFrom(deployer, user1, amount)
                  ).to.be.revertedWith("ERC20: insufficient allowance")
              })
              it("emits an approval event, when an approval occurs", async () => {
                  await expect(ourToken.approve(user1, amount)).to.emit(ourToken, "Approval")
              })
              it("the allowance being set is accurate", async () => {
                  await ourToken.approve(user1, amount)
                  const allowance = await ourToken.allowance(deployer, user1)
                  assert.equal(allowance.toString(), amount)
              })
              it("won't allow a user to go over the allowance", async () => {
                  await ourToken.approve(user1, amount)
                  await expect(
                      playerToken.transferFrom(deployer, user1, (40 * multiplier).toString())
                  ).to.be.revertedWith("ERC20: insufficient allowance")
              })
          })
      })
