// contracts/script/DeployYieldScales.s.sol
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../YieldScalesPool.sol";

contract DeployYieldScales is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        
        address rbtcSynth = 0x5b9375b4ac0f61C7D5af32374aCCe0d058cE6F58;
        address feeVault = 0x1384d3A60a910B5b402ee09457b3eBfCC964FD4f;
        address oracle = 0xea8fFEe94Da08f65765EC2A095e9931FD03e6c1b; // committee
        
        YieldScalesPool yieldScales = new YieldScalesPool(
            rbtcSynth,
            feeVault,
            oracle
        );
        
        console.log("YieldScalesPool deployed at:", address(yieldScales));
        
        vm.stopBroadcast();
    }
}