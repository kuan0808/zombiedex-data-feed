const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "../zombiedex.json");

async function main() {
  // deploy bytes32toIPFS converter to localhost
  const Converter = await hre.ethers.getContractFactory("Bytes32ToIPFS");
  const converter = await Converter.deploy();
  await converter.deployed();

  // your rpc provider
  const apiKey = process.env.ALCHEMY_API_KEY;
  const provider = new ethers.providers.AlchemyProvider("mainnet", apiKey);

  // zombieClub contract address
  const address = "0x9c80777CAe192E5031c38A0d951C55730eCC3f5e";

  // time formatting util function
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    return [h, m > 9 ? m : h ? "0" + m : m || "0", s > 9 ? s : "0" + s]
      .filter(Boolean)
      .join(":");
  }

  // "tokenBaseURIHashes" is stored at slot 22 of the zombieClub contract
  const getTokenStates = async (tokenId) => {
    let results = [];
    let slot = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [tokenId, 22]
    );
    for (let i = 0; i < 4; i++) {
      let data = await provider.getStorageAt(
        address,
        ethers.BigNumber.from(slot).add(i)
      );
      results.push(data);
    }
    return results;
  };

  // "tokenInternalInfo" is stored at slot 24 of the zombieClub contract
  const getTokenChangePeriod = async (tokenId) => {
    let slot = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [tokenId, 24]
    );
    let data = await provider.getStorageAt(address, slot);
    let period = "0x" + data.toString().slice(-50, -34);
    let last = "0x" + data.toString().slice(-34, -18);
    period = ethers.utils.hexZeroPad(period, 32);
    last = ethers.utils.hexZeroPad(last, 32);
    return [
      ethers.BigNumber.from(last).toNumber(),
      formatTime(ethers.BigNumber.from(period).toNumber()),
    ];
  };

  // main function to call
  const getZombiedex = async (tokenId) => {
    let hashes = await getTokenStates(tokenId);
    let cids = [];
    if (
      hashes[0] ==
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    )
      return null;
    for (let j = 0; j < hashes.length; j++) {
      let hash = hashes[j];
      if (
        hash ==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      ) {
        continue;
      }
      let cid = await converter.cidv0FromBytes32(hash);
      cids.push(cid);
    }
    let [last, period] = await getTokenChangePeriod(tokenId);
    return {
      token_id: tokenId,
      change_period: period,
      last_change: last,
      phase_0: cids[0],
      phase_1: cids[1],
      phase_2: cids.length > 2 ? cids[2] : null,
      phase_3: cids.length > 3 ? cids[3] : null,
    };
  };
  // This is for batch processing

  // const promises = [];
  // for (let i = 0; i < 6666; i++) {
  //   promises.push(getZombiedex(i));
  // }
  // const results = JSON.parse(fs.readFileSync(filePath, "utf8"));
  // const data = await Promise.all(promises);
  // const zombiedex = data.filter((x) => x != null);
  // results.push(...zombiedex);
  // fs.writeFileSync(filePath, JSON.stringify(results, null, 2));

  console.log("Getting zombiedex...");

  // use whatever tokenId you want here
  const data = await getZombiedex(63);

  console.log(data);
  console.log("Done!");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
