//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReferralWood is Ownable {

    uint16 public structure;

    struct Chest {
        uint256 priceInBNB;
        uint256 amountOfReferralsToUnlock;
    }

    struct User {
        uint8 currentLevel;
        address referrer;
    }

    mapping(uint8 => Chest) public chestsList;
    mapping(address => User) public usersList;
    mapping(address => mapping(uint8 => address[])) public userReferralsByLevel;


    constructor() {
        structure = 3;
        for (uint8 i; i < 7; i++) {
            chestsList[i].amountOfReferralsToUnlock = structure**(i+1); // set amount of users to unlock for every chest in list
            chestsList[i].priceInBNB = 5 ether * (2**i) / 100; // set initial price to each chest level
        }
        usersList[msg.sender].referrer = msg.sender;
    }

    function joinTo(address _referrer) public payable returns(bool) {
        require(msg.value >= chestsList[usersList[msg.sender].currentLevel].priceInBNB, "Insufficient funds to buy chest");
        require(usersList[_referrer].referrer != address(0), "Referrer should be registered already");
        if(msg.value > chestsList[usersList[msg.sender].currentLevel].priceInBNB) {
            payable(msg.sender).transfer(msg.value - chestsList[usersList[msg.sender].currentLevel].priceInBNB);    // cashback if user sent more than current chest price
        } 
        if(usersList[msg.sender].referrer != address(0)) {   // check if sender is already registered on platform
            return false;
        } 
        if(usersList[_referrer].currentLevel == 0) {
            usersList[msg.sender].referrer = _referrer; // set new user's referrer if _referrer on 0 level
            emit Joined(msg.sender, _referrer);
        } else {
            for(uint16 referralPosition; referralPosition < userReferralsByLevel[_referrer][usersList[_referrer].currentLevel - 1].length; referralPosition ++) {
                address currentReferral = userReferralsByLevel[_referrer][usersList[_referrer].currentLevel - 1][referralPosition];
                if(userReferralsByLevel[currentReferral][0].length < structure) {
                    usersList[msg.sender].referrer = currentReferral;   // set new user's referrer if _referrer not on 0 level
                    emit Joined(msg.sender, currentReferral);
                }
            }
        } 
        address[7] memory referrerTree = myTree();
        for(uint8 referrerIndex = 1; referrerIndex < referrerTree.length; referrerIndex ++) {
            userReferralsByLevel[referrerTree[referrerIndex]][referrerIndex - 1].push(msg.sender);  // push referral to all referrers in tree on exact level
            if(userReferralsByLevel[referrerTree[referrerIndex]][referrerIndex - 1].length == chestsList[referrerIndex - 1].amountOfReferralsToUnlock && usersList[referrerTree[referrerIndex]].currentLevel < 7) {
                payable(referrerTree[referrerIndex]).transfer(chestsList[referrerIndex - 1].priceInBNB); // unlock chest  
                emit ChestUnlocked(referrerTree[referrerIndex], usersList[referrerTree[referrerIndex]].currentLevel);
                usersList[referrerTree[referrerIndex]].currentLevel += 1;
            }
        }
        return true;
    }

    function setPrice(uint8 _numberOfChest, uint256 _priceInBNB) external onlyOwner() {
        require(_numberOfChest < 7, "Chest total is 7");
        chestsList[_numberOfChest].priceInBNB = _priceInBNB;
    }

    function myTree() public view returns(address[7] memory) {
        address sender = msg.sender;
        address[7] memory referrersList;
        for(uint8 i; i < 7; i++) {
            referrersList[i] = sender;
            if(sender == usersList[sender].referrer) {
                break;
            }
            sender = usersList[sender].referrer;
        }
        return referrersList;
    }

    function setCurrentStructure(uint8 _structure) public onlyOwner() {
        structure = _structure;
        for (uint8 i; i < 7; i++) {
            chestsList[i].amountOfReferralsToUnlock = structure**(i+1); // set amount of users to unlock for every chest in list
        }
    }
    
    function level(address _user) public view returns(uint8) {
        return usersList[_user].currentLevel;
    } 

    function parent() public view returns(address) {
        return usersList[msg.sender].referrer;
    }

    event Joined(address indexed _user, address _referrer);
    event ChestUnlocked(address indexed _owner, uint8 _level);
}