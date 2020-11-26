const TreasuryBondsPlus = artifacts.require('./TreasuryBondsPlus')
let instance, owner, decimals, balanceOfOwner, totalSupply, pow, quantity, balanceOfTo,
feeAddress, reserveAddress, balanceOfFeeAddress, balanceOfReserveAddress, balanceOfFrom

contract('TreasuryBondsPlus', async accounts => {

  it('should put 50,000,000 TB+ in the owner account and total supply', async () => {

    instance = await TreasuryBondsPlus.deployed()
    owner = await instance.owner()
    balanceOfOwner = await instance.balanceOf(owner)
    totalSupply = await instance.totalSupply()
    decimals = await instance.decimals()
    pow = Math.pow(10, decimals.toNumber())
    assert.equal(balanceOfOwner.toNumber(), 50000000 * pow)
    assert.equal(totalSupply.toNumber(), 50000000 * pow)

  })

  it('should transfer 500 TB+ to account 1', async () => {

    instance = await TreasuryBondsPlus.deployed()
    decimals = await instance.decimals()
    quantity = 500 * Math.pow(10, decimals.toNumber())
    await instance.transfer(accounts[1], quantity)

    balanceOfTo = await instance.balanceOf(accounts[1])
    owner = await instance.owner()
    balanceOfOwner = await instance.balanceOf(owner)
    const initialTotalSupply = 50000000 * Math.pow(10, decimals.toNumber())

    assert.equal(balanceOfTo.toNumber(), quantity, 'Account 1 has 1 TB+ in its balance')
    assert.equal(balanceOfOwner.toNumber(), initialTotalSupply - quantity, 'The owner must have the balance subtracted')

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
    feeAddress = await instance.feeAddress()
    balanceOfFeeAddress = await instance.balanceOf(feeAddress)

    assert.isAtLeast(quantityToAccount2, 100 + tax, 'The amount of tokens transferred must be greater than or equal to 1 + tax')
    assert.equal(balanceOfFrom.toNumber(), initialBalanceOfFrom.toNumber() - quantityToAccount2, 'Account 1 must have the balance subtracted')
    assert.equal(balanceOfTo.toNumber(), quantityToAccount2 - tax, 'Account 2 must have the balance equal to the amount received minus the tax')
    assert.equal(balanceOfFeeAddress.toNumber(), tax, 'The balance of feeAddress must equal the tax')

  })

  it('should approve 200 TB+ from account 1 to account 3 and the latter must transfer the amount', async () => {

    instance = await TreasuryBondsPlus.deployed()
    feeAddress = await instance.feeAddress()
    decimals = await instance.decimals()
    pow = Math.pow(10, decimals.toNumber())
    quantity = 200 * Math.pow(10, decimals.toNumber())
    const initialBalanceOfFrom = await instance.balanceOf(accounts[1])
    await instance.approve(accounts[3], quantity, { from: accounts[1] })
    const allowedOld = await instance.allowance(accounts[1], accounts[3])
    const balanceOfFeeAddressOld = await instance.balanceOf(feeAddress)
    await instance.transferFrom(accounts[1], accounts[3], quantity, { from: accounts[3] })

    balanceOfFrom = await instance.balanceOf(accounts[1])
    balanceOfTo = await instance.balanceOf(accounts[3])
    balanceOfFeeAddress = await instance.balanceOf(feeAddress)
    const allowedNew = await instance.allowance(accounts[1], accounts[3])
    const tax = (quantity / 100) * 0.5 // 0,50 % tax

    assert.equal(allowedOld.toNumber(), quantity, 'The approved permission from account 1 to account 3 must equal the amount')
    assert.equal(balanceOfFrom.toNumber(), initialBalanceOfFrom - quantity, 'The balance of account 1 must be the same as the old balance - the amount')
    assert.equal(balanceOfTo.toNumber(), quantity - tax, 'Account 3 must have the balance equal to the amount received minus the tax')
    assert.equal(balanceOfFeeAddress.toNumber(), balanceOfFeeAddressOld.toNumber() + tax, 'The balance of the feeAddress must be equal to the previous feeAddress + tax')
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

  it('should buy back the tokens of account 1', async () => {

    instance = await TreasuryBondsPlus.deployed()
    reserveAddress = await instance.reserveAddress()
    const initialBalanceOfAccount1 = await instance.balanceOf(accounts[1])
    quantity = initialBalanceOfAccount1.toNumber()
    await instance.buyBack(accounts[1], quantity)
    const balanceOfAccount1 = await instance.balanceOf(accounts[1])
    balanceOfReserveAddress = await instance.balanceOf(reserveAddress)

    assert.equal(balanceOfAccount1.toNumber(), 0, 'The balance of account 1 must be equal to 0')
    assert.equal(balanceOfReserveAddress.toNumber(), quantity, 'The balance of the buy back account must equal the amount repurchased')

  })

  it('should change the administrative addresses (owner, feeAddress and reserveAddress)', async () => {

    instance = await TreasuryBondsPlus.deployed()
    const oldOwner = await instance.owner()
    const balanceOfOwnerBefore = await instance.balanceOf(oldOwner)
    const oldFeeAddress = await instance.feeAddress()
    const balanceOfFeeAddressBefore = await instance.balanceOf(oldFeeAddress)
    const oldReserveAddress = await instance.reserveAddress()
    const balanceOfReserveAddressBefore = await instance.balanceOf(oldReserveAddress)
    await instance.newFeeAddress(accounts[4])
    await instance.newReserveAddress(accounts[5])
    await instance.newOwner(accounts[3])
    owner = await instance.owner()
    balanceOfOwner = await instance.balanceOf(owner)
    const balanceOfOldOwner = await instance.balanceOf(oldOwner)
    feeAddress = await instance.feeAddress()
    balanceOfFeeAddress = await instance.balanceOf(feeAddress)
    const balanceOfOldFeeAddress = await instance.balanceOf(oldFeeAddress)
    reserveAddress = await instance.reserveAddress()
    balanceOfReserveAddress = await instance.balanceOf(reserveAddress)
    const balanceOfOldReserveAddress = await instance.balanceOf(oldReserveAddress)

    assert.equal(owner, accounts[3], 'The address of the owner must be the same as that of account 3')
    assert.equal(balanceOfOwner.toNumber(), balanceOfOwnerBefore.toNumber(), 'The balance of the new owner must be equal to how much the old one had')
    assert.equal(balanceOfOldOwner.toNumber(), 0, 'The balance sheet of the old owner must equal zero')

    assert.equal(feeAddress, accounts[4], 'The address of the feeAddress must be the same as that of account 4')
    assert.equal(balanceOfFeeAddress.toNumber(), balanceOfFeeAddressBefore.toNumber(), 'The balance of the new feeAddress must be equal to how much the old one had')
    assert.equal(balanceOfOldFeeAddress.toNumber(), 0, 'The balance sheet of the old feeAddress must equal zero')

    assert.equal(reserveAddress, accounts[5], 'The address of the reserveAddress must be the same as that of account 5')
    assert.equal(balanceOfReserveAddress.toNumber(), balanceOfReserveAddressBefore.toNumber(), 'The balance of the new reserveAddress must be equal to how much the old one had')
    assert.equal(balanceOfOldReserveAddress.toNumber(), 0, 'The balance sheet of the old reserveAddress must equal zero')

  })

})