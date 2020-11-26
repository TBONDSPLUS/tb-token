require('dotenv').config()
const TreasuryBondsPlus = artifacts.require("TreasuryBondsPlus")

module.exports = function (deployer) {
  const feeAddress = process.env.FEE_ADDRESS
  const reserveAddress = process.env.RESERVE_ADDRESS
  deployer.deploy(TreasuryBondsPlus, feeAddress, reserveAddress)
}
