// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const witnet = require(process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH
    ? `../${process.env.WITNET_SOLIDITY_REQUIRE_RELATIVE_PATH}/assets`
    : "../../../../../witnet/assets"
);

let addresses = witnet.getAddresses(hre.network.name)
let WitnetRequestBytecodes, WitnetOracle, WitnetRequestFactory;

module.exports = { run };

async function run(args) {
    if (!addresses?.WitnetOracle) {
        throw Error(`No Witnet addresses for network "${hre.network.name}"`)
    }
    if (!addresses.templates) addresses.templates = {}
    if (!addresses.requests) addresses.requests = {}

    const header = `${hre.network.name.toUpperCase()}`
    console.info()
    console.info(header)
    console.info("=".repeat(header.length))

    process.stdout.write("WitnetRequestBytecodes:      " + addresses.WitnetRequestBytecodes + " ")
    WitnetRequestBytecodes = await hre.ethers.getContractAt(
        witnet.artifacts.WitnetRequestBytecodes.abi,
        addresses.WitnetRequestBytecodes,
    );
    process.stdout.write(
      await _readUpgradableArtifactVersion(WitnetRequestBytecodes, addresses.WitnetRequestBytecodes)
    );

    process.stdout.write("WitnetOracle:   " + addresses.WitnetOracle + " ")
    WitnetOracle = await hre.ethers.getContractAt(
        witnet.artifacts.WitnetOracle.abi,
        addresses.WitnetOracle,
    );
    process.stdout.write(
        await _readUpgradableArtifactVersion(WitnetOracle, addresses.WitnetOracle)
    );

    process.stdout.write("WitnetRequestFactory: " + addresses.WitnetRequestFactory + " ")
    WitnetRequestFactory = await hre.ethers.getContractAt(
        witnet.artifacts.WitnetRequestFactory.abi,
        addresses.WitnetRequestFactory,
    );
    process.stdout.write(
        await _readUpgradableArtifactVersion(WitnetRequestFactory, addresses.WitnetRequestFactory)
    );

    await deployWitnetRequestTemplates(witnet.templates, args)
    await deployWitnetRequests(witnet.requests, args)
}

async function deployWitnetRequestTemplates(templates, args) {
    // TODO
}

async function deployWitnetRequests(requests, args) {
  // TODO
}

async function _readUpgradableArtifactVersion(contract, address) {
    try {
        const upgradable = await hre.ethers.getContractAt(
            witnet.artifacts.WitnetUpgradableBase.abi,
            address
        );
        return `(v${await upgradable.version()})\n`
    } catch {
        return "(???)\n"
    }
}
