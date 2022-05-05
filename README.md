# How to run

1. Change the Alchemy API key in .env file to yours
2. Change to your desired token id in getZombieInfo.js

```JS
const data = await getZombiedex(63);
```

Then

```shell
npm install
npx hardhat node
```

Leave the above shell up running, and in another shell

```shell
node scripts/getZombieInfo.js --network localhost
```

Feel free to create your own web app using the pre-fetched json provided as database 🙂
If there's any missing, use tutorials above to fetch newly revealed zombie info
