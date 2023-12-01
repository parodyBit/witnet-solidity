const Witnet = require("witnet-utils")
const selection = Witnet.Utils.getWitnetArtifactsFromArgs()

const witnet_require_path = process.env.WITNET_SOLIDITY_REQUIRE_PATH || "../../../../witnet";
const witnet_module_path = process.env.WITNET_SOLIDITY_MODULE_PATH || "node_modules/witnet-solidity/witnet";

const templates = require(`${witnet_require_path}/assets`).templates

const WitnetBytecodes = artifacts.require("WitnetBytecodes")
const WitnetRequestFactory = artifacts.require("WitnetRequestFactory")
const WitnetRequestTemplate = artifacts.require("WitnetRequestTemplate")

module.exports = async function (_deployer, network, [from, ]) {
  const isDryRun = network === "test" || network.split("-")[1] === "fork" || network.split("-")[0] === "develop"
  const ecosystem = Witnet.Utils.getRealmNetworkFromArgs()[0]
  network = network.split("-")[0]

  const addresses = isDryRun ? require(`../../tests/addresses`) : require(`${witnet_require_path}/assets/addresses`)
  if (!addresses[ecosystem]) addresses[ecosystem] = {}
  if (!addresses[ecosystem][network]) addresses[ecosystem][network] = {}
  if (!addresses[ecosystem][network].templates) addresses[ecosystem][network].templates = {}

  await deployWitnetRequestTemplates(addresses, from, isDryRun, ecosystem, network, templates) 
}

async function deployWitnetRequestTemplates (addresses, from, isDryRun, ecosystem, network, templates) {
  for (const key in templates) {
    const template = templates[key]
    if (template?.specs) {
      const targetAddr = addresses[ecosystem][network].templates[key] ?? null
      if (
        process.argv.includes("--all")
          || selection.includes(key)
          || targetAddr === "" 
          || (!Witnet.Utils.isNullAddress(targetAddr) && (await web3.eth.getCode(targetAddr)).length <= 3)
      ) {
        try {
          const templateAddr = await Witnet.Utils.deployWitnetRequestTemplate(
            web3,
            from,
            await WitnetBytecodes.deployed(),
            await WitnetRequestFactory.deployed(),
            template,
            key,
          )
          const templateContract = await WitnetRequestTemplate.at(templateAddr)
          console.info("  ", "> Template registry:  ", await templateContract.registry.call())
          console.info("  ", `> Template address:    \x1b[1;37m${templateContract.address}\x1b[0m`)
          addresses[ecosystem][network].templates[key] = templateAddr
          Witnet.Utils.saveAddresses(addresses, isDryRun ? `${witnet_module_path}/tests` : `${witnet_require_path}/assets`)
        } catch (e) {
          Witnet.Utils.traceHeader(`Failed '\x1b[1;31m${key}\x1b[0m': ${e}`)
          process.exit(0)
        }
      } else if (!Witnet.Utils.isNullAddress(targetAddr)) {
        Witnet.Utils.traceHeader(`Skipping '\x1b[1;37m${key}\x1b[0m'`)
        console.info("  ", `> Template address:  \x1b[1;37m${targetAddr}\x1b[0m`)
      }
    } else {
      await deployWitnetRequestTemplates (addresses, from, isDryRun, ecosystem, network, template)
    }
  }
}
