require('dotenv').config()
const TreasuryBondsPlus = artifacts.require("TreasuryBondsPlus")

module.exports = function (deployer) {
  const transaction_tax = process.env.TRANSACTION_TAX_ADDRESS
  const buy_back = process.env.BUY_BACK_ADDRESS
  deployer.deploy(TreasuryBondsPlus, transaction_tax, buy_back)
}
