const TreasuryBondsPlus = artifacts.require('./TreasuryBondsPlus')
let instance, owner, decimals, balanceOfOwner, totalSupply, pow, quantity, balanceOfTo,
transactionFee, buyBack, balanceOfTransactionFee, balanceOfBuyBack, balanceOfFrom

contract('TreasuryBondsPlus', async accounts => {

  it('should put 200,000 TB+ in the owner account and total supply', async () => {

    instance = await TreasuryBondsPlus.deployed()
    owner = await instance.owner()
    balanceOfOwner = await instance.balanceOf(owner)
    totalSupply = await instance.totalSupply()
    decimals = await instance.decimals()
    pow = Math.pow(10, decimals.toNumber())
    assert.equal(balanceOfOwner.toNumber(), 200000 * pow)
    assert.equal(totalSupply.toNumber(), 200000 * pow)

  })

  it('should transfer 500 TB+ to account 1', async () => {

    instance = await TreasuryBondsPlus.deployed()
    decimals = await instance.decimals()
    quantity = 500 * Math.pow(10, decimals.toNumber())
    await instance.transfer(accounts[1], quantity)

    balanceOfTo = await instance.balanceOf(accounts[1])
    owner = await instance.owner()
    balanceOfOwner = await instance.balanceOf(owner)
    const initialTotalSupply = 200000 * Math.pow(10, decimals.toNumber())
    const purchaseRecordAccount1 = await instance.purchaseRecords(accounts[1])

    assert.equal(balanceOfTo.toNumber(), quantity, 'Account 1 has 1 TB+ in its balance')
    assert.equal(balanceOfOwner.toNumber(), initialTotalSupply - quantity, 'The owner must have the balance subtracted')
    assert.equal(purchaseRecordAccount1[0].quantity, quantity, 'Account 1 must be in the purchase records with the correct quantity')

  })

  it('should transfer 100 TB+ from account 1 to account 2', async () => {

    instance = await TreasuryBondsPlus.deployed()
    const initialBalanceOfFrom = await instance.balanceOf(accounts[1])
    decimals = await instance.decimals()
    pow = Math.pow(10, decimals.toNumber())
    const quantityToAccount2 = 100 * pow
    await instance.transfer(accounts[2], quantityToAccount2, { from: accounts[1] })

    balanceOfFrom = await instance.balanceOf(accounts[1])
    balanceOfTo = await instance.balanceOf(accounts[2])
    const tax = (quantityToAccount2 / 100) * 0.5 // 0,50 % tax
    transactionFee = await instance.transactionFee()
    balanceOfTransactionFee = await instance.balanceOf(transactionFee)
    const purchaseRecordAccount2 = await instance.purchaseRecords(accounts[2])

    assert.isAtLeast(quantityToAccount2, 100 + tax, 'The amount of tokens transferred must be greater than or equal to 1 + tax')
    assert.equal(balanceOfFrom.toNumber(), initialBalanceOfFrom.toNumber() - quantityToAccount2, 'Account 1 must have the balance subtracted')
    assert.equal(balanceOfTo.toNumber(), quantityToAccount2 - tax, 'Account 2 must have the balance equal to the amount received minus the tax')
    assert.equal(balanceOfTransactionFee.toNumber(), tax, 'The balance of transactionFee must equal the tax')
    assert.equal(purchaseRecordAccount2[0].quantity, quantityToAccount2 - tax, 'Account 2 must be in the purchase records with the correct quantity')

  })

  it('should approve 200 TB+ from account 1 to account 3 and the latter must transfer the amount', async () => {

    instance = await TreasuryBondsPlus.deployed()
    transactionFee = await instance.transactionFee()
    decimals = await instance.decimals()
    pow = Math.pow(10, decimals.toNumber())
    quantity = 200 * Math.pow(10, decimals.toNumber())
    const initialBalanceOfFrom = await instance.balanceOf(accounts[1])
    await instance.approve(accounts[3], quantity, { from: accounts[1] })
    const allowedOld = await instance.allowance(accounts[1], accounts[3])
    const balanceOfTransactionFeeOld = await instance.balanceOf(transactionFee)
    await instance.transferFrom(accounts[1], accounts[3], quantity, { from: accounts[3] })

    balanceOfFrom = await instance.balanceOf(accounts[1])
    balanceOfTo = await instance.balanceOf(accounts[3])
    balanceOfTransactionFee = await instance.balanceOf(transactionFee)
    const purchaseRecordAccount2 = await instance.purchaseRecords(accounts[3])
    const allowedNew = await instance.allowance(accounts[1], accounts[3])
    const tax = (quantity / 100) * 0.5 // 0,50 % tax

    assert.equal(allowedOld.toNumber(), quantity, 'The approved permission from account 1 to account 3 must equal the amount')
    assert.equal(balanceOfFrom.toNumber(), initialBalanceOfFrom - quantity, 'The balance of account 1 must be the same as the old balance - the amount')
    assert.equal(balanceOfTo.toNumber(), quantity - tax, 'Account 3 must have the balance equal to the amount received minus the tax')
    assert.equal(balanceOfTransactionFee.toNumber(), balanceOfTransactionFeeOld.toNumber() + tax, 'The balance of the transactionFee must be equal to the previous transactionFee + tax')
    assert.equal(purchaseRecordAccount2[0].quantity, quantity - tax, 'Account 3 must be in the purchase records with the correct quantity')
    assert.equal(allowedNew.toNumber(), allowedOld.toNumber() - quantity, 'The approved permission from account 1 to account 3 must equal the old permission - the amount')

  })

  it('should issue 50,000 new tokens', async () => {

    instance = await TreasuryBondsPlus.deployed()
    decimals = await instance.decimals()
    owner = await instance.owner()
    const balanceOfOwnerOld = await instance.balanceOf(owner)
    const totalSupplyOld = await instance.totalSupply()
    quantity = 50000 * Math.pow(10, decimals.toNumber())
    await instance.mint(owner, quantity)
    balanceOfOwner = await instance.balanceOf(owner)
    const totalSupplyNew = await instance.totalSupply()

    assert.equal(balanceOfOwner.toNumber(), balanceOfOwnerOld.toNumber() + quantity, 'The balance of owner must equal the old total supply + the new quantity issued')
    assert.equal(totalSupplyNew.toNumber(), totalSupplyOld.toNumber() + quantity, 'The total supply must be equal to the old total supply + new quantity issued')

  })

  it('should burn 10,000 tokens from the owner account', async () => {

    instance = await TreasuryBondsPlus.deployed()
    decimals = await instance.decimals()
    owner = await instance.owner()
    const balanceOfOwnerOld = await instance.balanceOf(owner)
    const totalSupplyOld = await instance.totalSupply()
    quantity = 10000 * Math.pow(10, decimals.toNumber())
    await instance.burn(owner, quantity)
    balanceOfOwner = await instance.balanceOf(owner)
    const totalSupplyNew = await instance.totalSupply()

    assert.equal(balanceOfOwner.toNumber(), balanceOfOwnerOld.toNumber() - quantity, 'The balance of owner must be the same as the old one - the amount burned')
    assert.equal(totalSupplyNew.toNumber(), totalSupplyOld.toNumber() - quantity, 'The total supply must equal the old total supply - the amount burned')

  })

  it('should repurchase the tokens of account 1', async () => {

    instance = await TreasuryBondsPlus.deployed()
    buyBack = await instance.buyBack()
    const initialBalanceOfAccount1 = await instance.balanceOf(accounts[1])
    quantity = initialBalanceOfAccount1.toNumber()
    await instance.repurchase(accounts[1], quantity)
    const balanceOfAccount1 = await instance.balanceOf(accounts[1])
    balanceOfBuyBack = await instance.balanceOf(buyBack)

    assert.equal(balanceOfAccount1.toNumber(), 0, 'The balance of account 1 must be equal to 0')
    assert.equal(balanceOfBuyBack.toNumber(), quantity, 'The balance of the buy back account must equal the amount repurchased')

  })

  it('should approve the KYC of account 1', async () => {

    instance = await TreasuryBondsPlus.deployed()
    await instance.approveKYC(accounts[1])
    const approvedKYC = await instance.getApprovedKYC(accounts[1])

    assert.isTrue(approvedKYC, 'The KYC value must be true')

  })

  it('should change the administrative addresses (owner, transactionFee and buyBack)', async () => {

    instance = await TreasuryBondsPlus.deployed()
    const oldOwner = await instance.owner()
    const balanceOfOwnerBefore = await instance.balanceOf(oldOwner)
    const oldTransactionFee = await instance.transactionFee()
    const balanceOfTransactionFeeBefore = await instance.balanceOf(oldTransactionFee)
    const oldBuyBack = await instance.buyBack()
    const balanceOfBuyBackBefore = await instance.balanceOf(oldBuyBack)
    await instance.newTransactionFee(accounts[4])
    await instance.newBuyBack(accounts[5])
    await instance.newOwner(accounts[3])
    owner = await instance.owner()
    balanceOfOwner = await instance.balanceOf(owner)
    const balanceOfOldOwner = await instance.balanceOf(oldOwner)
    transactionFee = await instance.transactionFee()
    balanceOfTransactionFee = await instance.balanceOf(transactionFee)
    const balanceOfOldTransactionFee = await instance.balanceOf(oldTransactionFee)
    buyBack = await instance.buyBack()
    balanceOfBuyBack = await instance.balanceOf(buyBack)
    const balanceOfOldBuyBack = await instance.balanceOf(oldBuyBack)

    assert.equal(owner, accounts[3], 'The address of the owner must be the same as that of account 3')
    assert.equal(balanceOfOwner.toNumber(), balanceOfOwnerBefore.toNumber(), 'The balance of the new owner must be equal to how much the old one had')
    assert.equal(balanceOfOldOwner.toNumber(), 0, 'The balance sheet of the old owner must equal zero')

    assert.equal(transactionFee, accounts[4], 'The address of the transactionFee must be the same as that of account 4')
    assert.equal(balanceOfTransactionFee.toNumber(), balanceOfTransactionFeeBefore.toNumber(), 'The balance of the new transactionFee must be equal to how much the old one had')
    assert.equal(balanceOfOldTransactionFee.toNumber(), 0, 'The balance sheet of the old transactionFee must equal zero')

    assert.equal(buyBack, accounts[5], 'The address of the buyBack must be the same as that of account 5')
    assert.equal(balanceOfBuyBack.toNumber(), balanceOfBuyBackBefore.toNumber(), 'The balance of the new buyBack must be equal to how much the old one had')
    assert.equal(balanceOfOldBuyBack.toNumber(), 0, 'The balance sheet of the old buyBack must equal zero')

  })


})