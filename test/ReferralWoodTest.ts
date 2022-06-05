import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { ReferralWood } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { utils, BigNumber } from "ethers";


describe("ReferralWood", function() {

    let Bob: SignerWithAddress;
    let Alice: SignerWithAddress;
    let Mike: SignerWithAddress;
    let Tony: SignerWithAddress;
    let Jacy: SignerWithAddress;
    let Tim: SignerWithAddress;
    let Ann: SignerWithAddress;
    let Alex: SignerWithAddress;
    let Paul: SignerWithAddress;
    let Dave: SignerWithAddress;

    let referralWood: ReferralWood;

    const firstChestPrice: BigNumber = utils.parseUnits("0.05", 18);


    beforeEach(async function() {
        [Bob, Alice, Mike, Tony, Jacy, Tim, Ann, Alex, Paul, Dave] = await ethers.getSigners();

        const ReferralWood = await ethers.getContractFactory("ReferralWood", Bob);
        referralWood = await ReferralWood.deploy();
        await referralWood.deployed();
    })

    it("Should be deployed", async function() {
        expect(referralWood.address).to.be.properAddress;
    })

    describe("Set chest price", function() {

        it("Should set price for chest by chest index", async function() {
            await referralWood.connect(Bob).setPrice(0, 100);

            expect((await referralWood.chestsList(0)).priceInBNB)
            .to.be.equal(100)
        })

        it("Should be reverted with error message because of Alice not a contract owner", async function() {
            await expect(referralWood.connect(Alice).setPrice(0, 100))
            .to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("Should be reverted with message because of wrong chest number", async function() {
            await expect(referralWood.connect(Bob).setPrice(8, 100))
            .to.be.revertedWith("Chest total is 7")
        })
    })

    describe("Parent view function", function () {

        it("Should show a referrer of user", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });

            expect((await referralWood.connect(Alice).parent()))
            .to.be.equal(Bob.address)
        })
    })

    describe("User level view function", function() {

        it("Should retern 0 level because of 1 referral", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });

            expect((await referralWood.connect(Alice).level(Alice.address)))
            .to.be.equal(0)
        })

        it("Should return 1 level because of 4 referrals", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Mike).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Tony).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Jacy).joinTo(Bob.address, { value: firstChestPrice });

            expect((await referralWood.connect(Bob).level(Bob.address)))
            .to.be.equal(1)
        })
    })

    describe("Amount of referrals to unlock setting in constructor", function() {

        it("Should set amount of refferals to each of chests", async function() {
            expect((await referralWood.chestsList(1)).amountOfReferralsToUnlock)
            .to.be.equal(9)
        })
    })

    describe("Join To function", function() {

        it("Should set user referrer if user is not registered yet", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });

            expect((await referralWood.connect(Alice).usersList(Alice.address)).referrer)
            .to.be.equal(Bob.address)
        })

        it("Should stay users first referrer if user is already registered", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Alice).joinTo(Alice.address, { value: firstChestPrice});

            expect((await referralWood.connect(Alice).usersList(Alice.address)).referrer)
            .to.be.equal(Bob.address)
        })

        it("Should be reverted because of insufficient value of tx", async function() {
            await expect(referralWood.joinTo(Alice.address, { value: 50 }))
            .to.be.reverted
        })

        it("Should be reverted with error message because of referrer is not registered on platform yet", async function() {
            await expect(referralWood.connect(Alice).joinTo(Mike.address, { value: firstChestPrice }))
            .to.be.revertedWith("Referrer should be registered already")
        })

        it("Should send users money back if msg value greater then chest price", async function() {
            const firstChestPrice2x: BigNumber = utils.parseUnits("1", 18);
            const firstChestPriceMinus: BigNumber = utils.parseUnits("-0.05", 18);

            await expect(() => referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice2x }))
            .to.changeEtherBalance(Alice, firstChestPriceMinus)
        })

        it("Should add referrals to referrals list", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });

            expect((await referralWood.userReferralsByLevel(Bob.address, 0, 0)))
            .to.be.equal(Alice.address)
        })

        it("Should emit Joined event", async function() {
            await expect(referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice }))
            .to.emit(referralWood, "Joined")
            .withArgs(Alice.address, Bob.address)
        })
        
        it("Should unlock chest and transfer chest price to referrer", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Mike).joinTo(Bob.address, { value: firstChestPrice });
            
            await expect(() => referralWood.connect(Tony).joinTo(Bob.address, { value: firstChestPrice }))
            .to.changeEtherBalance(Bob, firstChestPrice)
        })

        it("Should emit ChestUnlocked event", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Mike).joinTo(Bob.address, { value: firstChestPrice });

            await expect(referralWood.connect(Tony).joinTo(Bob.address, { value: firstChestPrice }))
            .to.emit(referralWood, "ChestUnlocked")
            .withArgs(Bob.address, 0)
        })
    
        it("Should add 2 referrals to next level", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Mike).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Tony).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Jacy).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Tim).joinTo(Bob.address, { value: firstChestPrice });

            expect((await referralWood.userReferralsByLevel(Bob.address, 1, 0)))
            .to.be.equal(Jacy.address) 
        }) 

        it("Should add 2 referrals to Tony's 0 level", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Mike).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Tony).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Jacy).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Tim).joinTo(Bob.address, { value: firstChestPrice });

            expect((await referralWood.userReferralsByLevel(Tony.address, 0, 0)))
            .to.be.equal(Jacy.address) 
        })

        it("Should add 3 referral to Mike's 0 level", async function() {
            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Mike).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Tony).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Jacy).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Tim).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Ann).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Alex).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Paul).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Dave).joinTo(Bob.address, { value: firstChestPrice });

            expect((await referralWood.userReferralsByLevel(Mike.address, 0, 0)))
            .to.be.equal(Alex.address) 
        })
    })

    describe("Change structure function", function() {

        it("Should change structure number to 4", async function() {
            await referralWood.connect(Bob).setCurrentStructure(4);

            expect((await referralWood.structure()))
            .to.be.equal(4)
        })

        it("Should add 1 referral to Tony's 0 level because of new structure", async function() {
            await referralWood.connect(Bob).setCurrentStructure(4);

            await referralWood.connect(Alice).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Mike).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Tony).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Jacy).joinTo(Bob.address, { value: firstChestPrice });
            await referralWood.connect(Tim).joinTo(Bob.address, { value: firstChestPrice });

            expect((await referralWood.userReferralsByLevel(Jacy.address, 0, 0)))
            .to.be.equal(Tim.address) 
        })

        it("Should revert with error message because of Alice is not a owner of the contract", async function() {
            await expect(referralWood.connect(Alice).setCurrentStructure(4))
            .to.be.revertedWith("Ownable: caller is not the owner")
        })
    })
})